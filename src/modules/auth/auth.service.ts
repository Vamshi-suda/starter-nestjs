import {BadRequestException, HttpException, Injectable, UnauthorizedException} from '@nestjs/common';
import {JwtService} from '@nestjs/jwt';
import {ConfigService} from '@nestjs/config';
import {UserService} from '../user/user.service';
import {MFAAuthType, LoginPayload, LoginMfaOtpPayload} from './payload/login.payload';
import {InjectModel} from '@nestjs/mongoose';
import {IUser} from '../user/models/IUser';
import IMFAAuth, {IAuthOTP, IEmailOTP, MFAMode} from './models/IMFAAuth';
import {randomGenerator} from 'src/utils/helpers';
import {MFAModes, MFAModules} from './enums/MFAModules';
import {SessionService} from './session.service';
import {EmailService} from 'src/services/email/email.service';
import {FORGOT_GLID_RECOVER_TYPE, MFAType} from './payload/mfaAuth.payload';
import {FilterQuery, Model, Types, UpdateQuery, mongo} from 'mongoose';
import {UserDeleteStatus} from '../user/models/user.schema';
import {VerifyOtpPayload} from './payload/verifyOtp.payload';
import {IGenerateOtpResponse, IMfaStatus, IOtpVerifyResponse} from './dto/MfaStatus.dto';
import {recoveryRequest} from './payload/mfaAuth.payload';
import {ISession, SessionState} from './models/session.model';
import {ContactClassification} from '@/common/models/enums';
import {hashPassword, verifyPassword} from '@/utils/helpers/passwordhelper';
import {uuid} from '@/utils/uuid';
import {LoginAttempt, PreAuthDetails} from './enums/Session';
import {AuthStatus} from './models/authentication.schema';
import {CreateSession} from './payload/session.payload';
import axios from 'axios';
import * as crypto from 'crypto';

/**
 * Models a typical Login/Register route return body
 */
export interface ITokenReturnBody {
  /**
   * When the token is to expire in seconds
   */
  expires: string;
  /**
   * A human-readable format of expires
   */
  expiresPrettyPrint: string;
  /**
   * The Bearer token
   */
  token: string;
}

const EXPIRY_IN_MINUTES = 5;
/**
 * Authentication Service
 */
@Injectable()
export class AuthService {
  /**
   * Time in seconds when the token is to expire
   * @type {string}
   */
  private readonly expiration: string;
  private readonly serviceId: string;
  private readonly FASTER_BASE_URL: string;
  public readonly IP_AND_GEO_LOCATION_API: string;
  //private readonly twilioService: Twilio;

  /**
   * Constructor
   * @param {JwtService} jwtService jwt service
   * @param {ConfigService} configService
   * @param {UserService} userService user service
   * @param {EmailService} emailService email service
   */
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly userService: UserService,
    private readonly sessionSer: SessionService,
    private readonly emailService: EmailService,
    @InjectModel('MFAAuth') private readonly mfaAuthModel: Model<IMFAAuth>,
  ) {
    this.expiration = this.configService.get('WEBTOKEN_EXPIRATION_TIME');
    this.FASTER_BASE_URL = this.configService.get('FASTER_BASE_URL');
    this.IP_AND_GEO_LOCATION_API = this.configService.get('IP_AND_GEO_LOCATION_API');
  }

  async getUserWithGlid(glid: string) {
    const masterUser = await this.userService.getMasterUserByGLID(glid);
    if (!masterUser) {
      throw new BadRequestException('Invalid GLID');
    }
    return await this.userService.getUserByQuery({glid, deleteStatus: {$ne: UserDeleteStatus.Deleted}, location: masterUser.location});
  }

  async createSession(ip: string, location: string, payload: CreateSession) {
    return this.sessionSer.createUnidentifiedSession(ip, location, `${payload.OS.name} ${payload.OS.version} - ${payload.browser.name}`);
  }

  async getSession(id: string) {
    return this.sessionSer.getByGuid(id);
  }

  async endSession(sessionId: string, status: AuthStatus) {
    const session = await this.sessionSer.getByGuid(sessionId);
    if (!session) {
      throw new BadRequestException('Invalid session');
    }
    const auth = await this.sessionSer.getAuthBySessionId(sessionId);
    if (!auth || auth.status !== AuthStatus.ACTIVATED) {
      throw new BadRequestException('Invalid session');
    }
    await this.sessionSer.inActivateSession(sessionId);
    await this.sessionSer.inActivateAuthentication(auth.guid, status);
    return {
      message: 'success',
    };
  }

  async endAllSessions(currentSessionId: string, userId: string) {
    await this.sessionSer.closeAllSessions(currentSessionId, userId, AuthStatus.CLOSE_SESSION);
    return {
      message: 'success',
    };
  }

  async getSessionDetail(sessionId: string, userId: string) {
    const session = await this.sessionSer.getByGuid(sessionId);
    if (session.userId === userId && session.sessionState === SessionState.Active) {
      const auth = await this.sessionSer.getAuthBySessionId(session.guid);
      if (this.sessionSer.isTimeOut(session) || auth.status !== AuthStatus.ACTIVATED) {
        return new BadRequestException('Session timeout');
      }
      const _session: ISession = session.toObject();
      return _session;
    }
    throw new BadRequestException('Invalid session');
  }

  async generateLoginOtp(glid: string, mode: MFAMode, session_id: string) {
    const masterUser = await this.userService.getMasterUserByGLID(glid);
    if (!masterUser) {
      throw new BadRequestException('Invalid GLID');
    }
    const session = await this.sessionSer.getByGuid(session_id);
    if (!session) {
      throw new BadRequestException('Invalid session');
    }
    const user = await this.userService.getUserByQuery({glid, location: masterUser.location});
    if (user) {
      await this.sessionSer.identifySession(session._id, user.guid, user.name);
      const auth = await this.sessionSer.createOrUpdateInActiveAuthentication(session.guid);
      const link = `${this.FASTER_BASE_URL}/en/login/confirm?ref=${auth.guid}`;
      let mfaAuthDetails: {
        guid: string;
        exp: string;
      };
      switch (mode) {
        case 'email':
          mfaAuthDetails = await this.sendMFAtoEmail(user, session_id, link, 'MFA-login');
          break;
        case 'message':
          mfaAuthDetails = await this.sendMFAtoPhone(user, session_id, link, 'MFA-login');
          break;
        case 'call':
          mfaAuthDetails = await this.sendMFAtoPhone(user, session_id, link, 'MFA-login');
          break;
        default:
          throw new BadRequestException(`Invalid MFA type: ${mode}`);
      }
      return mfaAuthDetails;
    } else {
      throw new BadRequestException('Invalid GLID');
    }
  }

  async loginWithPassword({glid, password}: LoginPayload, session_id: string) {
    const masterUser = await this.userService.getMasterUserByGLID(glid);
    if (!masterUser) {
      throw new BadRequestException('Invalid GLID');
    }
    const session = await this.sessionSer.getByGuid(session_id);
    if (!session) {
      throw new BadRequestException('Invalid session');
    }
    const user = await this.userService.getUserByQuery({glid, location: masterUser.location});
    if (!user) {
      throw new BadRequestException('Invalid GLID');
    }
    await this.sessionSer.identifySession(session._id, user.guid, user.name);

    if (await verifyPassword(masterUser.password, password)) {
      const verifiedMFAs: string[] = [];
      if (masterUser.primaryEmail) {
        verifiedMFAs.push('email');
      }
      if (masterUser.primaryPhone) {
        verifiedMFAs.push('mobile');
      }
      if (verifiedMFAs.length === 0) {
        const auth = await this.sessionSer.createOrUpdateInActiveAuthentication(session.guid);
        await this.sessionSer.activateSession(session._id);
        try {
          return {
            status: 'success',
            requiredMFAauth: false,
            ...(auth ? auth.toObject() : undefined),
          };
        } catch (err) {
          throw new BadRequestException('Invalid session');
        }
      }
      return {
        status: 'success',
        requiredMFAauth: true,
        verifiedMFAs,
      };
    } else {
      this.sessionSer.pushPreAuth(session.guid, {
        time: new Date(),
        details: PreAuthDetails.INCORRECT_PASSWORD,
        attempt: LoginAttempt.FAILURE,
      });
      throw new BadRequestException('Invalid password');
    }
  }

  async loginWithMFA({glid, mfaId, otp, authType}: LoginMfaOtpPayload, session_id: string) {
    try {
      const session = await this.sessionSer.getByGuid(session_id);
      if (!session) {
        throw new BadRequestException('Invalid session');
      }
      const masterUser = await this.userService.getMasterUserByGLID(glid);
      if (!masterUser) {
        throw new BadRequestException('Invalid GLID');
      }
      const user = await this.userService.getUserByQuery({glid, location: masterUser.location});
      if (user) {
        let val: {
          verified: boolean;
        };
        switch (authType) {
          case MFAAuthType.MOBILE:
            //Mobile MFA validation
            val = await this.verifyMFA(mfaId, otp, MFAAuthType.MOBILE, user, true);
            break;
          case MFAAuthType.EMAIL:
            //EMAIL MFA validation
            val = await this.verifyMFA(mfaId, otp, MFAAuthType.EMAIL, user, true);
            break;
          case MFAAuthType.PHONECALL:
            //phone call validation
            val = await this.verifyMFA(mfaId, otp, MFAAuthType.MOBILE, user, true);
            break;
          default:
            throw new BadRequestException('Invalid login type');
        }
        if (val.verified) {
          const auth = await this.sessionSer.getAuthBySessionId(session.guid);
          return {
            ref: auth.guid,
          };
        }
      } else {
        throw new BadRequestException('Invalid GLID');
      }
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      }
      if (err instanceof Error) {
        throw new BadRequestException(err.message);
      }
      throw new BadRequestException(err);
    }
  }

  async checkSessionActiveState(session_id: string) {
    const session = await this.sessionSer.getByGuid(session_id);
    if (!session) {
      throw new BadRequestException('Invalid session');
    }
    if (session.sessionState === SessionState.Active) {
      const auth = await this.sessionSer.getAuthBySessionId(session.guid);
      if (auth)
        return {
          state: SessionState.Active,
          ref: auth.guid,
          lastAccessTime: session.lastAccessTime,
        };
    }
    return {
      state: 'pending',
    };
  }

  async verifyLoginAuthRef(refId: string) {
    const auth = await this.sessionSer.getAuthByGuid(refId);
    if (!auth || auth.status !== AuthStatus.CREATED) {
      throw new BadRequestException('invalid verification');
    }
    const session = await this.sessionSer.getByGuid(auth.session_id);
    if (!session || !session.userId) {
      throw new BadRequestException('invalid session');
    }
    const masterUser = await this.userService.getMasterUserByGuid(session.userId);
    if (!masterUser) {
      throw new BadRequestException('Invalid GLID');
    }
    const user = await this.userService.getByGUID(session.userId, masterUser.location);
    if (!user) {
      throw new BadRequestException('invalid verification');
    }
    await this.sessionSer.activateSession(session._id);
  }

  async verifyLoginMagicLink(refId: string, guid: string, mode: 'e' | 'p') {
    if (!['e', 'p'].includes(mode)) {
      throw new BadRequestException('Invalid Link');
    }
    const mfa = await this.mfaAuthModel
      .findOne({
        guid: guid,
      })
      .exec();
    if (!mfa) {
      throw new BadRequestException('Invalid Link');
    }
    const otpDetails = mode === 'e' ? mfa.otpAuth.email : mfa.otpAuth.mobile;
    if (!otpDetails || otpDetails.isVerifiedByMagicLink) {
      throw new BadRequestException('Invalid Link');
    }

    if (new Date(mfa.expiryDate) < new Date()) {
      throw new BadRequestException('MFA expired');
    }
    await this.verifyLoginAuthRef(refId);
    const _mfaDetails = await this.updateMFADetails(
      {guid: guid},
      {
        [`otpAuth.${mode === 'e' ? 'email' : 'mobile'}.isVerifiedByMagicLink`]: true,
      },
    );
  }

  async getInitialAuthValue(sessionId: string, authId: string) {
    const session = await this.sessionSer.getByGuid(sessionId);
    if (!session || !session.userId) {
      throw new BadRequestException('invalid session');
    }
    const auth = await this.sessionSer.getAuthByGuid(authId);
    if (!auth || auth.status !== AuthStatus.CREATED) {
      throw new BadRequestException('invalid verification');
    }
    const masterUser = await this.userService.getMasterUserByGuid(session.userId);
    if (!masterUser) {
      throw new BadRequestException('Invalid GLID');
    }
    const user = await this.userService.getByGUID(session.userId, masterUser.location);
    if (!user) {
      throw new BadRequestException('invalid verification');
    }
    await this.sessionSer.activateAuthentication(authId, user);
    const _auth = await this.sessionSer.getAuthByGuid(authId);
    return {
      ..._auth?.toObject(),
      userId: session.userId,
    };
  }

  async getNewToken(sessionId: string, refreshToken: string) {
    if (!sessionId || !refreshToken) {
      throw new BadRequestException('Invalid request');
    }
    return this.sessionSer.createNewToken(sessionId, refreshToken);
  }

  async getLatestUserSessionMFA(userId: string, sessionId: string, mode: 'email' | 'mobile', module: string, reason: string) {
    return (
      await this.mfaAuthModel
        .find({
          sessionId,
          module,
          reason,
          [`otpAuth.${mode}`]: {
            $ne: null,
          },
          expiryDate: {
            $gt: new Date().toISOString(),
          },
          userId,
        })
        .sort({
          creationDate: 'desc',
        })
        .exec()
    )[0];
  }

  async sendMFAtoEmail(user: IUser, sessionId: string, magicLink: string, reason: string) {
    const mfa = await this.getLatestUserSessionMFA(user.guid, sessionId, 'email', MFAModules.LOGIN, reason);
    if (mfa) {
      return {
        guid: mfa.guid,
        exp: mfa.expiryDate,
      };
    }

    const emailOTP = randomGenerator(6);
    const guid = uuid();
    magicLink = magicLink + `&mode=e&guid=${guid}`;
    const verifiedEmail = user.contact.email.find((a) => a.isVerified);
    if (verifiedEmail) {
      const mfa = await this.writeOtps({
        otpAuth: {
          mobile: null,
          email: {otp: emailOTP, address: verifiedEmail.address},
        },
        module: MFAModules.LOGIN,
        reason,
        glid: user.glid,
        magicLink: magicLink,
        guid,
        sessionId,
        userId: user.guid,
      } as IMFAAuth);
      if (reason === 'MFA-login')
        this.emailService.sendOtpMailForAuth(verifiedEmail.address, emailOTP, magicLink).catch((err) => {
          console.log('mfa email err', err);
        });
      if (reason === 'forgot-password') await this.emailService.sendResetPassword(verifiedEmail.address, emailOTP, magicLink);
      return {
        guid: mfa.guid,
        exp: mfa.expiryDate,
      };
    } else {
      throw new BadRequestException('No verified Email found');
    }
  }

  async sendMFAtoPhone(user: IUser, sessionId: string, link: string, reason: string) {
    const mfa = await this.getLatestUserSessionMFA(user.guid, sessionId, 'mobile', MFAModules.REGISTRATION, reason);
    if (mfa) {
      return {
        guid: mfa.guid,
        exp: mfa.expiryDate,
      };
    }

    const mobileOTP = randomGenerator(6);
    const verifiedMobile = user.contact.mobile.find((a) => a.isVerified);
    const guid = uuid();
    const magicLink = link + `&mode=p&guid=${guid}`;

    if (verifiedMobile) {
      const mfa = await this.writeOtps({
        otpAuth: {
          mobile: {mobileNumber: verifiedMobile.number, otp: mobileOTP},
          email: null,
        },
        module: MFAModules.REGISTRATION,
        reason,
        glid: user.glid,
        magicLink,
        guid,
        sessionId,
        userId: user.guid,
      } as IMFAAuth);
      // this.twilioService.verify.v2
      //   .services(this.serviceId)
      //   .verifications.create({
      //     to: user.contact.mobile.find((a) => a.isVerified).number,
      //     channel: 'sms',
      //   })
      //   .then((verification) => console.log(verification));
      return {
        guid: mfa.guid,
        exp: mfa.expiryDate,
      };
    } else {
      throw new BadRequestException('No verified mobile number found');
    }
  }

  async verifyMFA(mfaId: string, otp: string, authType: MFAAuthType, user: IUser, isLink: boolean) {
    // verify MFA
    const mfaDetails = (await this.getMFADetailsByQuery({guid: mfaId}))[0];
    if (!mfaDetails) {
      throw new BadRequestException('Invalid MFA');
    }
    let OTPdetails: IAuthOTP | IEmailOTP;
    if (authType == MFAAuthType.MOBILE) {
      OTPdetails = mfaDetails.otpAuth.mobile;
    } else {
      OTPdetails = mfaDetails.otpAuth.email;
    }

    if (!OTPdetails || OTPdetails.isVerified) {
      throw new BadRequestException('Invalid MFA');
    }
    const generatedOtp: string = OTPdetails.otp;
    const mode = authType === MFAAuthType.MOBILE ? 'mobile' : 'email';

    if (new Date(mfaDetails.expiryDate) < new Date()) {
      throw new BadRequestException('OTP expired');
    }

    if (generatedOtp && generatedOtp === otp) {
      const _updateMFA = await this.updateMFADetails(
        {_id: mfaDetails._id},
        {
          [`otpAuth.${mode}.isVerified`]: true,
        },
      );

      return {
        verified: true,
      };
    } else {
      throw new UnauthorizedException('Invalid OTP');
    }
    // this.twilioService.verify.v2
    //   .services(this.serviceId)
    //   .verificationChecks.create({ to: phoneNumber, code: Otp.toString() })
    //   .then((verification_check) => console.log(verification_check));
  }

  async writeOtps(mfaAuthOTPs: IMFAAuth) {
    const exp = new Date().getTime() + EXPIRY_IN_MINUTES * 60000;
    if (mfaAuthOTPs.magicLink) mfaAuthOTPs.magicLink = mfaAuthOTPs.magicLink + `&exp=${exp}`;
    const mfaDoc = new this.mfaAuthModel({
      magicLinkSession: new mongo.ObjectId().toHexString(),
      ...mfaAuthOTPs,
      expiryDate: new Date(exp).toISOString(),
    });

    await mfaDoc.save();
    return mfaDoc.toObject({versionKey: false});
  }

  async getMFADetailsByQuery(filterQuery: FilterQuery<IMFAAuth>): Promise<IMFAAuth[]> {
    const mfaDetails = await this.mfaAuthModel.find(filterQuery);
    return mfaDetails;
  }

  async updateMFADetails(filterQuery: FilterQuery<IMFAAuth>, updateQuery: UpdateQuery<IMFAAuth>, options?) {
    const mfaDetails = await this.mfaAuthModel.findOneAndUpdate(filterQuery, updateQuery, {
      ...options,
      new: true,
    });
    return mfaDetails;
  }

  async getMFAStatus(sessionId): Promise<IMfaStatus> {
    const mfaDetails = await this.mfaAuthModel.findOne({guid: sessionId});
    const isMobileVerified = mfaDetails.otpAuth.mobile?.isVerified;
    const isEmailVerified = mfaDetails.otpAuth.email?.isVerified;
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
      expiryDateTime: new Date(mfaDetails.expiryDate),
    };
  }

  async glidHasPasswordFlow(glid: string) {
    const user = await this.userService.getMasterUserByGLID(glid);
    if (!user) {
      throw new BadRequestException('Invalid glid');
    }
    if (user.password)
      return {
        status: true,
      };
    return {
      status: false,
    };
  }

  async getUserMFAsByGlid(glid: string) {
    const masterUser = await this.userService.getMasterUserByGLID(glid);
    const user = await this.userService.findByGlid(glid, masterUser.location);
    if (!user) {
      throw new BadRequestException('invalid glid');
    }
    return {
      email: [
        {
          isVerified: !!masterUser.primaryEmail,
        },
      ],
      mobile: [
        {
          isVerified: !!masterUser.primaryPhone,
        },
      ],
      hasPassword: !!masterUser.password,
    };
  }

  async sendMFAtoGlidUser(glid: string, session_id: string, mfaType: MFAType, reason: string) {
    try {
      const session = await this.sessionSer.getByGuid(session_id);
      if (!session) {
        throw new BadRequestException('Invalid session');
      }
      const masterUser = await this.userService.getMasterUserByGLID(glid);
      const user = await this.userService.findByGlid(glid, masterUser.location);
      if (!masterUser || !user) {
        throw new BadRequestException('Invalid glid');
      }
      const contactType = mfaType === 'message' || mfaType === 'phone' ? 'mobile' : 'email';

      if (contactType === 'email' && !masterUser.primaryEmail) {
        throw new BadRequestException(`user doesn't have ${mfaType} MFA flow`);
      }
      if (contactType === 'mobile' && !masterUser.primaryPhone) {
        throw new BadRequestException(`user doesn't have ${mfaType} MFA flow`);
      }
      await this.sessionSer.identifySession(session._id, user.guid, user.name);
      const auth = await this.sessionSer.createOrUpdateInActiveAuthentication(session.guid);
      const link = `${this.FASTER_BASE_URL}/en/login/confirm?ref=${auth.guid}`;

      switch (mfaType) {
        case 'email':
          const emailMFA = await this.sendMFAtoEmail(user, session_id, link, reason);
          return {
            exp: emailMFA.exp,
            guid: emailMFA.guid,
          };
        case 'message':
        case 'phone':
          const mobileMFA = await this.sendMFAtoPhone(user, session_id, link, reason);
          return {
            exp: mobileMFA.exp,
            guid: mobileMFA.guid,
          };
      }
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      }
      throw new BadRequestException(err && typeof err === 'object' ? err.message : typeof err === 'string' ? err : 'runtime error');
    }
  }

  async validateOTPwithGLID(glid: string, reason: string, otp: string, session_id: string, guid: string) {
    const session = await this.sessionSer.getByGuid(session_id);
    const masterUser = await this.userService.getMasterUserByGLID(glid);
    if (!masterUser) {
      throw new BadRequestException('Invalid GLID');
    }
    const user = await this.userService.getByGUID(session.userId, masterUser.location);
    if (!session && !user) {
      new BadRequestException('Invalid session');
    }
    const mfaDoc = await this.mfaAuthModel.findOne({
      glid,
      guid,
      reason,
      $or: [{'otpAuth.mobile.otp': otp}, {'otpAuth.email.otp': otp}],
    });
    if (!mfaDoc) {
      throw new BadRequestException('Invalid OTP');
    }
    const mode = mfaDoc.otpAuth.email ? 'email' : 'mobile';

    let OTPdetails: IAuthOTP | IEmailOTP;
    if (mfaDoc.otpAuth.mobile) {
      OTPdetails = mfaDoc.otpAuth.mobile;
    } else {
      OTPdetails = mfaDoc.otpAuth.email;
    }

    if (!OTPdetails || OTPdetails.isVerified) {
      throw new BadRequestException('Invalid OTP');
    }

    if (new Date(mfaDoc.expiryDate) < new Date()) {
      throw new BadRequestException('OTP expired');
    }

    const mfaDetails = await this.updateMFADetails(
      {_id: mfaDoc._id},
      {
        [`otpAuth.${mode}.isVerified`]: true,
      },
    );

    const _session = await this.sessionSer.activateSession(session._id);
    const auth = await this.sessionSer.getAuthBySessionId(session.guid);
    return {
      status: 'verified',
      ref: auth.guid,
    };
  }

  async resetPassword(userId: string, newPassword: string) {
    const masterUser = await this.userService.getMasterUserByGuid(userId);
    if (!masterUser) {
      throw new BadRequestException('Invalid GLID');
    }
    const hashedPassWord = await hashPassword(newPassword);
    masterUser.password = hashedPassWord;
    await masterUser.save();
    return {
      status: 'success',
    };
  }

  async changePassword(userId: string, oldPassword: string, newPassword: string) {
    const masterUser = await this.userService.getMasterUserByGuid(userId);
    if (!masterUser) {
      throw new BadRequestException('Invalid GLID');
    }
    const user = await this.userService.getByGUID(userId, masterUser.location);
    if (!user) throw new BadRequestException('invalid session');
    if (
      Object.values(user.contact).find((mfaFields) => {
        return mfaFields.find((field) => field.isVerified);
      })
    )
      return {
        status: 'change with MFA',
      };

    if (oldPassword === newPassword) {
      throw new BadRequestException('new password must not be a old one');
    }

    const oldPasswordHash = await hashPassword(oldPassword);
    const newPasswordHash = await hashPassword(newPassword);

    if (masterUser.password !== oldPasswordHash) {
      throw new BadRequestException('Invalid old password');
    }

    await this.userService.updateUser(
      {
        _id: user._id,
      },
      {
        password: newPasswordHash,
      },
    );

    return {
      status: 'success',
    };
  }

  async deletePassword(userId: string) {
    const masterUser = await this.userService.getMasterUserByGuid(userId);
    if (!masterUser) {
      throw new BadRequestException('Invalid GLID');
    }
    const user = await this.userService.getByGUID(userId, masterUser.location);
    if (!user) {
      throw new BadRequestException('Invalid data');
    }

    masterUser.password = undefined;
    await masterUser.save();

    return {
      status: 'deleted password successfully',
    };
  }

  async recoveryGLID(type: FORGOT_GLID_RECOVER_TYPE, value: string, sessionId: string) {
    const session = await this.sessionSer.getByGuid(sessionId);
    if (!session) {
      throw new BadRequestException('Invalid session');
    }
    const filter: Record<string, any> = {};
    switch (type) {
      case 'email': {
        filter.primaryEmail = value;
        break;
      }
      case 'message': {
        filter.primaryPhone = value;
        break;
      }
      default:
        throw new BadRequestException('Invalid type');
    }

    const masterUser = await this.userService.getUserMasterByQuery(filter);
    if (!masterUser) {
      throw new BadRequestException('user not found');
    }
    const user = await this.userService.getUserByQuery({
      guid: masterUser.guid,
      location: masterUser.location,
    });

    if (!user) {
      throw new BadRequestException('user not found');
    }

    await this.sessionSer.identifySession(session._id, masterUser.guid, user.name);
    const auth = await this.sessionSer.createOrUpdateInActiveAuthentication(session.guid);
    const mfa = await this.getLatestUserSessionMFA(masterUser.guid, sessionId, 'email', MFAModules.LOGIN, 'recovery glid');
    if (mfa) {
      return {
        guid: mfa.guid,
        exp: mfa.expiryDate,
      };
    }

    const emailOTP = randomGenerator(6);
    const guid = uuid();
    let magicLink = `${this.FASTER_BASE_URL}/en/login/confirm?ref=${auth.guid}`;

    magicLink = magicLink + `&mode=e&guid=${guid}`;

    if (masterUser.primaryEmail) {
      const mfa = await this.writeOtps({
        otpAuth: {
          mobile: null,
          email: {otp: emailOTP, address: masterUser.primaryEmail},
        },
        module: MFAModules.LOGIN,
        reason: 'recovery glid',
        glid: masterUser.glid,
        magicLink: magicLink,
        guid,
        sessionId,
        userId: masterUser.guid,
      } as IMFAAuth);
      this.emailService.sendGLIDReminder(masterUser.primaryEmail, masterUser.glid, magicLink).catch((err) => {
        console.log('mfa email err', err);
      });
    }
    return {
      status: 'glid is sent successfully',
    };
  }

  // generate otp to reset password
  async generatePasswordMfa(glid: string, mode: MFAModes): Promise<string> {
    const masterUser = await this.userService.getMasterUserByGLID(glid);
    if (!masterUser) {
      throw new BadRequestException('Invalid GLID');
    }
    const user = await this.userService.getUserByQuery({glid, location: masterUser.location});
    const verifiedEmail = user.contact.email.find((a) => a.isVerified);
    const verifiedMobile = user.contact.mobile.find((a) => a.isVerified);
    const mfaDetails = await this.generateOtpForEmailOrMobile(
      mode === MFAModes.EMAIL ? verifiedEmail.address : '',
      mode === MFAModes.MOBILE ? verifiedMobile.number : '',
      MFAModules.PASSWORD,
    );
    // TODO  use if/switch no conditional ops
    // mode == MFAModes.EMAIL &&
    //   this.emailService.sendMail(
    //     mfaDetails.emailOtp,
    //     `http://localhost:3000/login/recover-maglic-link?mfaId=${mfaDetails.mfaId}&mode=${MFAModes.EMAIL}&isLink=true`,
    //   );
    return mfaDetails.mfaId;
  }

  //verify password reset mfa
  async verifyPasswordMfa({mfaId, otp, mode, isLink}: VerifyOtpPayload): Promise<IOtpVerifyResponse> {
    const validationResponse = await this.validateOtp({mfaId, otp, mode, isLink});
    return validationResponse;
  }

  // recover pending deletion account

  async recoverAccount({glid, email, mobile}: recoveryRequest): Promise<string> {
    const masterUser = await this.userService.getMasterUserByGLID(glid);
    if (!masterUser) {
      throw new BadRequestException('Invalid GLID');
    }
    const user = await this.userService.getUserByQuery({glid: glid, location: masterUser.location});
    const verifiedEmails = user.contact.email.filter((a) => a.isVerified).map((b) => b.address);
    const isEmailVerified = verifiedEmails.includes(email);
    const verifiedMobileNumbers = user.contact.mobile.filter((a) => a.isVerified).map((b) => b.number);
    const isMobileVerified = verifiedMobileNumbers.includes(mobile);
    let emailOtp: string = '',
      mobileOtp: string = '';
    if (isEmailVerified && isMobileVerified) {
      emailOtp = randomGenerator(6);
      mobileOtp = randomGenerator(6);
    } else if (isEmailVerified) {
      emailOtp = randomGenerator(6);
    } else if (isMobileVerified) {
      mobileOtp = randomGenerator(6);
    } else {
      throw new BadRequestException('given email or mobile  is not verified');
    }
    const mfa = await this.writeOtps({
      otpAuth: {
        mobile: mobileOtp ? {otp: mobileOtp, number: mobile} : null,
        email: emailOtp ? {otp: emailOtp, address: email} : null,
      },
      module: MFAModules.ACCOUNTRECOVERY,
    } as unknown as IMFAAuth);

    // TODO  use if/switch no conditional ops
    // emailOtp &&
    //   this.emailService.sendMail(
    //     emailOtp,
    //     `http://localhost:3000/login/recover-maglic-link?glid=${glid}&mfaId=${mfa._id.toString()}&mode=${MFAModes.EMAIL}&isLink=true`,
    //   );
    //mobile otp && //sms the otp
    return mfa._id.toString();
  }

  async verifyAccountRecovery({glid, mfaId, otp, mode, isLink}: VerifyOtpPayload): Promise<IOtpVerifyResponse> {
    const validationResponse = await this.validateOtp({glid, mfaId, otp, mode, isLink});
    await this.userService.updateUser(
      {glid},
      {
        $set: {
          deleteStatus: UserDeleteStatus.Recovered,
        },
      },
    );
    return validationResponse;
  }

  //helper methods
  async validateOtp({mfaId, otp, mode, isLink}: VerifyOtpPayload): Promise<IOtpVerifyResponse> {
    const mfaDetails = (await this.getMFADetailsByQuery({_id: new Types.ObjectId(mfaId)}))[0];

    const generatedOtp = mfaDetails.otpAuth[mode].otp;
    if ((otp && generatedOtp === otp) || !otp) {
      const mfaDetails = await this.updateMFADetails(
        {_id: mfaId},
        {
          [`otpAuth.${mode}.isVerified`]: true,
          [`otpAuth.${mode}.isVerifiedByMagicLink`]: isLink,
        },
      );
      const {
        otpAuth: {mobile, email},
      } = mfaDetails;
      return {
        isMobileVerified: mobile && (mobile.isVerified || mobile.isVerifiedByMagicLink),
        isEmailVerified: email && (email.isVerified || email.isVerifiedByMagicLink),
      };
    } else {
      throw new BadRequestException('Invalid OTP');
    }
  }

  async generateOtpForEmailOrMobile(email: string, mobile: string, module: MFAModules): Promise<IGenerateOtpResponse> {
    const emailOtp: string = email ? randomGenerator(6) : '',
      mobileOtp: string = mobile ? randomGenerator(6) : '';
    const mfa = await this.writeOtps({
      otpAuth: {
        mobile: mobileOtp ? {otp: mobileOtp, number: mobile} : null,
        email: emailOtp ? {otp: emailOtp, address: email} : null,
      },
      module: module,
    } as unknown as IMFAAuth);
    return {emailOtp, mobileOtp, mfaId: mfa._id.toString()};
  }

  // email update generate otp
  async generateEmailUpdateMfa({glid, email}: any) {
    const masterUser = await this.userService.getMasterUserByGLID(glid);
    if (!masterUser) {
      throw new BadRequestException('Invalid GLID');
    }
    const user = await this.userService.getUserByQuery({glid, location: masterUser.location});
    const isVerified = user.contact.email.some((a) => a.address === email && a.isVerified);
    if (isVerified) {
      return '';
    } else {
      const mfa = await this.generateOtpForEmailOrMobile(email, '', MFAModules.ACCOUNTRECOVERY);
      // this.emailService.sendMail(email, mfa.emailOtp, {
      //   //TODO
      // });
      return mfa.mfaId;
    }
  }

  async validateEmailUpdateMfa({glid, email, otp, isLink, mfaId}: any) {
    const masterUser = await this.userService.getMasterUserByGLID(glid);
    if (!masterUser) {
      throw new BadRequestException('Invalid GLID');
    }
    const {isEmailVerified} = await this.validateOtp({mfaId, otp, isLink, mode: MFAModes.EMAIL});
    if (isEmailVerified) {
      const user = await this.userService.getUserByQuery({glid, location: masterUser.location});
      const oldVerifiedEmail = user.contact.email.find((a) => a.isVerified)?.address;
      const updatedUser = await this.userService.updateUser(
        {glid},
        {
          $push: {
            'contact.email': {
              address: email,
              isVerified: true,
              classificationStatus: ContactClassification.PERSONAL,
            },
          },
        },
      );
      // TODO this.emailService.sendMail(oldVerifiedEmail, '');
      return updatedUser;
    }
  }

  async getExpiredMFAs(sessionId) {
    const fmas = await this.mfaAuthModel.find({
      sessionId,
      expiryDate: {
        $lt: new Date().toISOString(),
      },
    });
    return fmas
      .filter((mfa) => {
        const emailOTP = mfa.otpAuth.email;
        if (emailOTP && (!emailOTP.isVerified || !emailOTP.isVerifiedByMagicLink)) {
          return true;
        }
        const mobileOTP = mfa.otpAuth.mobile;
        if (mobileOTP && (!mobileOTP.isVerified || !mobileOTP.isVerifiedByMagicLink)) {
          return true;
        }
        return false;
      })
      .map((mfa) => {
        return {
          time: mfa.creationDate,
          attempt: LoginAttempt.FAILURE,
          details: '2FA code expired',
        };
      });
  }

  // password compromised  check with have i been pawned API
  async isPasswordCompromised(password: string) {
    const sha1Hash = crypto.createHash('sha1');
    const hashedPassWord = sha1Hash.update(password).digest('hex').toUpperCase();
    const response = await axios.get(`https://api.pwnedpasswords.com/range/${hashedPassWord.slice(0, 5)}`);
    const compromisedHash = JSON.stringify(response.data);
    return compromisedHash.includes(hashedPassWord.slice(5));
  }
}
