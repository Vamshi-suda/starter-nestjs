import {BadRequestException, Injectable} from '@nestjs/common';
import {InjectModel} from '@nestjs/mongoose';
import {Model, Types} from 'mongoose';
import {mongo} from 'mongoose';

import {CountrySupportedStatus} from '../countries/enums/CountrySupport';
import {GlidStatus} from '../glid/models/glid.schema';
import GlidService from '../glid/glid.service';
import {UserService} from '../user/user.service';
import Glid from '../glid/models/glid';
import {randomGenerator} from 'src/utils/helpers';
import {AuthService} from '../auth/auth.service';
import IMFAAuth, {IEmailOTP, IMobileOTP} from '../auth/models/IMFAAuth';
import {MFAModes, MFAModules} from '../auth/enums/MFAModules';

import {ContactClassification} from '@/common/models/enums';
import ICountry from '../countries/models/ICountry';
import {IUser, Preference, UserMaster} from '../user/models/IUser';
import {UserRegistrationPayload} from './payload/registration.payload';
import {TimeMode} from 'src/utils/enums';
import {EmailService} from '@/services/email/email.service';
import {IEmailContact} from '@/common/models/emailContact.schema';
import {IPhoneContact} from '@/common/models/phoneContact.schema';
import {SessionService} from '../auth/session.service';
import {AuthenticationState, ISession, SessionState} from '../auth/models/session.model';
import {uuid} from '@/utils/uuid';
//Clean up
interface UserDetails {
  userDetails: IUser[];
}

@Injectable()
export class RegistrationService {
  constructor(
    @InjectModel('Country') private readonly countryModel: Model<ICountry>,
    @InjectModel('AttemptedRegistrations')
    private readonly attemptedRegistrations: Model<UserRegistrationPayload>,
    @InjectModel('UserMaster')
    private readonly userMaster: Model<UserMaster>,
    private userService: UserService,
    private emailService: EmailService,
    private glidService: GlidService,
    private authService: AuthService,
    private sessionService: SessionService,
  ) {}
  MFA_TIMEOUT = Number(process.env.MFA_TIMEOUT_MIN);
  public async validateRegistration(registerDetails: UserRegistrationPayload) {
    try {
      const country = await this.countryModel.findOne({
        'iso3166_1.alpha_2': registerDetails.countryCode,
      });
      if (!country) {
        throw new BadRequestException({message: 'Invalid Country'});
      }

      const registrationSupport = country.support.find((x) => x.type.toLowerCase() === 'registration');

      if (!registrationSupport || registrationSupport.status !== CountrySupportedStatus.SUPPORTED) {
        throw new BadRequestException({
          message: 'Registration is not supported in this country yet',
        });
      }

      let glidDetails = await this.glidService.checkIfGlidIsAvailable(registerDetails.glid);
      const {status} = glidDetails;

      if (glidDetails.status === GlidStatus.UNRESERVED) {
        if (glidDetails.new) {
          glidDetails = await this.glidService.addGlidIfNotExists(registerDetails.glid);
        }
        const {isEmailVerified, isMobileVerified} = {isEmailVerified: false, isMobileVerified: false};

        // const sentOTPDetails = await this.authService.getMFADetailsByQuery({
        //   $and: [
        //     {
        //       $or: [{'otpAuth.mobile.mobileNumber': registerDetails.mobile}, {'otpAuth.email.address': registerDetails.email}],
        //     },
        //     {
        //       expiryDate: {$gt: new Date().toISOString()},
        //     },
        //   ],
        // });

        const hasOTPSentToThisMail = false;
        const hasOTPSentToThisMobile = false;

        const phoneOTP: IMobileOTP = {
          mobileNumber: registerDetails.mobile,
          otp: registerDetails.mobile && !isMobileVerified && !hasOTPSentToThisMobile ? randomGenerator(6) : null,
        };

        const emailOTP: IEmailOTP = {
          address: registerDetails.email,
          otp: registerDetails.email && !isEmailVerified && !hasOTPSentToThisMail ? randomGenerator(6) : null,
        };

        const storedOTP = await this.authService.writeOtps({
          otpAuth: {mobile: phoneOTP, email: emailOTP},
          magicLinkSession: uuid(),
          module: MFAModules.REGISTRATION,
        } as IMFAAuth);

        if (phoneOTP) {
          // TODO this.emailService.sendMail();
        }

        if (emailOTP.otp) {
          this.emailService.sendOtpMailForConfirmEmail(
            emailOTP.address,
            emailOTP.otp,
            `${process.env.MAGICLINK_URL.replace('locale', registerDetails.languageCode)}?module=registration&mfaSession=${
              storedOTP.magicLinkSession
            }&mode=e`,
          );
        }

        await this.glidService.updateGlid({glid: glidDetails.glid}, {$push: {mfaAuthIds: {$each: [storedOTP.guid], position: 0}}});

        new this.attemptedRegistrations({
          ...registerDetails,
          mfaSessionId: storedOTP.guid,
        }).save();

        return storedOTP.guid;
      } else {
        if (status === GlidStatus.PENDING) {
          throw new BadRequestException({
            message: 'Glid is under proclaimation by other user',
          });
        }

        if (status === GlidStatus.RESERVED) {
          throw new BadRequestException({message: 'Glid is Not available'});
        }
      }
    } catch (err) {
      throw new Error(err);
    }
  }

  private async CreateOrUpdateUser(mode: MFAModes, newUser: UserRegistrationPayload | undefined, user?: IUser) {
    if (newUser) {
      const {user, userMaster} = this.createUserModelFromRegistrationDetails(newUser, mode);
      const userDetails = (await this.userService.create(user)).toObject<IUser>();
      if (mode === MFAModes.EMAIL) {
        userMaster.primaryEmail = newUser.email;
      }
      if (mode === MFAModes.MOBILE) {
        userMaster.primaryPhone = newUser.mobile;
        userMaster.dialCode = newUser.dialCode;
      }

      this.userService.createMasterUser({...userMaster, guid: userDetails.guid});
      return userDetails;
    } else {
      const updateFieldName = mode === MFAModes.MOBILE ? 'number' : 'address';

      await this.userService.updateUser(
        {
          guid: user.guid,
          location: user.location,
        },
        {
          $set: {
            [`contact.${mode}.$[item].isVerified`]: true,
            [`contact.${mode}.$[item].isPrimary`]: true,
          },
        },
        {
          arrayFilters: [
            {
              [`item.${updateFieldName}`]: user.contact[mode][0][updateFieldName],
            },
          ],
        },
      );
      const updateQuery = MFAModes.EMAIL
        ? {primaryEmail: user.contact.email[0].address}
        : {primaryPhone: user.contact.mobile[0].number, dialCode: user.contact.mobile[0].dialCode};
      await this.userMaster.updateOne({guid: user.guid}, updateQuery);
    }
  }

  private createUserModelFromRegistrationDetails(newUser: UserRegistrationPayload, authMode: string) {
    const user = {
      glid: newUser.glid,
      name: newUser.name,
      contact: {mobile: [], email: []},
      location: newUser.countryCode,
      preference: {
        language: newUser.languageCode,
        hourFormat: TimeMode.HR_12,
        timeZone: 'utc',
      } as Preference,
    } as IUser;

    const userMaster = {
      glid: newUser.glid,
      location: newUser.countryCode,
    } as UserMaster;

    if (newUser.email) {
      user.contact.email.push({
        address: newUser.email,
        isVerified: MFAModes.EMAIL === authMode,
        classification: ContactClassification.PERSONAL,
        isAuthenticationEnabled: true,
        isPrimary: MFAModes.EMAIL === authMode,
      });
    }

    if (newUser.mobile) {
      user.contact.mobile.push({
        number: newUser.mobile,
        isVerified: MFAModes.MOBILE === authMode,
        classification: ContactClassification.PERSONAL,
        isAuthenticationEnabled: true,
        isPrimary: MFAModes.EMAIL === authMode,
        dialCode: newUser.dialCode,
        countryCode: newUser.countryCode,
      });
    }
    return {user, userMaster};
  }

  public async authenticateEmailOrMobile({mfaAuthId, otp, magicLinkMode = ''}) {
    if (magicLinkMode && magicLinkMode !== MFAModes.EMAIL && magicLinkMode !== MFAModes.MOBILE) {
      throw new BadRequestException({
        message: 'Magic Link Mode is not supported' + magicLinkMode,
      });
    }
    const query = magicLinkMode ? {magicLinkSession: mfaAuthId} : {guid: mfaAuthId};
    let mfaDetails = (
      await this.authService.getMFADetailsByQuery({
        ...query,
        module: MFAModules.REGISTRATION,
      })
    )[0] as IMFAAuth;

    let authMode: MFAModes;
    if (!mfaDetails) {
      throw new BadRequestException('MFA Auth For Registration does not exist with this MFA AuthId' + mfaAuthId);
    }
    const {
      otpAuth: {mobile, email},
      otpAuth,
      expiryDate,
    } = mfaDetails;

    const isMagicLinkExpired = magicLinkMode && otpAuth[magicLinkMode].isVerifiedByMagicLink;
    if (new Date(expiryDate) > new Date() && (!magicLinkMode || !isMagicLinkExpired)) {
      if (otp) {
        //Edge Case:And condition is required in case of same OTPs generated for mobile and email
        if (email && email.otp === otp && !email.isVerified) {
          authMode = MFAModes.EMAIL;
        }

        if (mobile?.otp === otp) {
          authMode = MFAModes.MOBILE;
        }
      }
      if (magicLinkMode) {
        authMode = magicLinkMode as MFAModes;
      }
      if (authMode) {
        if (!magicLinkMode || (magicLinkMode && !otpAuth[magicLinkMode].isVerifiedByMagicLink)) {
          const userInfo = (
            await this.attemptedRegistrations.aggregate([
              {
                $match: {
                  mfaSessionId: mfaDetails.guid,
                },
              },
              {
                $lookup: {
                  from: 'usermasters',
                  localField: 'glid',
                  foreignField: 'glid',
                  as: 'userDetails',
                },
              },
              {
                $addFields: {
                  guid: '$userDetails.guid',
                },
              },
              {
                $lookup: {
                  from: 'users',
                  localField: 'guid',
                  foreignField: 'guid',
                  as: 'result',
                },
              },
            ])
          )[0];
          const {userDetails, guid, result, ...attemptedRegistration} = userInfo;
          if (authMode === MFAModes.EMAIL || authMode === MFAModes.MOBILE) {
            if (!userDetails[0]) {
              await this.CreateOrUpdateUser(authMode, attemptedRegistration as UserRegistrationPayload);
            } else {
              await this.CreateOrUpdateUser(authMode, undefined, result[0]);
            }

            mfaDetails = await this.authService.updateMFADetails(
              {_id: mfaDetails._id},
              {
                [`otpAuth.${authMode}.isVerified`]: true,
                [`otpAuth.${authMode}.isPrimary`]: true,
                [`otpAuth.${authMode}.isVerifiedByMagicLink`]: !!magicLinkMode,
              },
            );
          }
        }
      } else {
        if (!magicLinkMode) {
          return {
            isInvalidOTP: true,
          };
        } else {
          throw new BadRequestException('Unsupported Mode');
        }
      }
    }

    const isMobileVerified = !!mfaDetails.otpAuth?.mobile?.isVerified;
    const isEmailVerified = !!mfaDetails.otpAuth?.email?.isVerified;
    const didUserOptMail = !!mfaDetails.otpAuth?.email?.address;
    const didUserOptMobile = !!mfaDetails.otpAuth?.mobile?.mobileNumber;
    return {
      didUserOptMail,
      didUserOptMobile,
      isMobileVerified,
      isEmailVerified,
      isFlowCompleted:
        (didUserOptMail && didUserOptMobile && isMobileVerified && isEmailVerified) ||
        (didUserOptMail && !didUserOptMobile && isEmailVerified) ||
        (didUserOptMobile && !didUserOptMail && isMobileVerified),
      isExpired: new Date(mfaDetails.expiryDate) < new Date(),
      expiryDateTime: mfaDetails.expiryDate,
      isMagicLinkExpired,
    };
  }

  private async informUserIfContactIsUsed(email: string, mobile: string) {
    const contactsVerifiedForUser = await this.userService.aggregateUser([
      {
        $lookup: {
          from: 'users',
          let: {
            guid: '$guid',
            location: '$location',
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    {
                      $eq: ['$guid', '$$guid'],
                    },
                    {
                      $eq: ['$location', '$$location'],
                    },
                  ],
                },
              },
            },
          ],
          as: 'user',
        },
      },
      {
        $unwind: '$user',
      },
      {
        $match: {
          $or: [
            {
              $and: [
                {
                  'user.contact.email.address': email,
                  'user.contact.email.isVerified': true,
                },
              ],
            },
            {
              $and: [
                {
                  'user.contact.mobile.number': mobile,
                  'user.contact.mobile.isVerified': true,
                },
              ],
            },
          ],
        },
      },
    ]);

    let userEmailContact: IEmailContact;
    let userPhoneContact: IPhoneContact;
    contactsVerifiedForUser.forEach((x) => {
      const emailDetails = (x.user as IUser).contact.email.find((x) => x.address === email);
      if (email) {
        userEmailContact = emailDetails;
      }
    });

    contactsVerifiedForUser.forEach((x) => {
      const phone = (x.user as IUser).contact.mobile.find((x) => x.number === mobile);
      if (email) {
        userPhoneContact = phone;
      }
    });
    return {
      isEmailVerified: !!userEmailContact,
      isMobileVerified: !!userPhoneContact,
    };
  }

  public async getRegistrationMFAStatus(mfaAuthId: string) {
    return await this.authService.getMFAStatus(mfaAuthId);
  }

  public async generateSession(mfaSessionId: string) {
    const userDetails = (
      await this.attemptedRegistrations.aggregate([
        {
          $match: {
            mfaSessionId,
          },
        },
        {
          $lookup: {
            from: 'usermasters',
            localField: 'glid',
            foreignField: 'glid',
            as: 'userDetails',
          },
        },
        {
          $addFields: {
            guid: '$userDetails.guid',
          },
        },
        {
          $unwind: '$guid',
        },
      ])
    )[0];

    const sessionDetails = await this.sessionService.createSession({
      authenticationState: AuthenticationState.Identified,
      userId: userDetails.guid,
      sessionState: SessionState.Active,
      lastAccessTime: Math.floor(Date.now() / 1000),
    } as ISession);

    const auth = await this.sessionService.addAuthenticationRecordToSession(sessionDetails.guid, userDetails);
    const jwtToken = auth.jwtToken;
    const refreshToken = auth.refreshToken;
    const session = sessionDetails.guid;

    return {jwtToken, refreshToken, session};
  }
}
