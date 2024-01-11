import {BadRequestException, Injectable} from '@nestjs/common';
import {Model} from 'mongoose';
import {InjectModel} from '@nestjs/mongoose';
import ISecurityPolicy from './models/ISecurityPolicy';
import {verifyPassword} from 'src/utils/helpers/passwordhelper';
import {PolicyLevel} from './enums/securityPolicy';

@Injectable()
export class SecurityPolicyService {
  constructor(
    @InjectModel('SecurityPolicy')
    private readonly securityPolicyModel: Model<ISecurityPolicy>,
  ) {}

  // Global Registration Portal
  public async getGlobalRegistrationStatus() {
    try {
      const globalRegistrationStatus = await this.securityPolicyModel
        .findOne(
          {level: PolicyLevel.PLATFORM},
          {
            _id: 0,
            globalRegistration: 1,
          },
        )
        .exec();
      if (globalRegistrationStatus) {
        return globalRegistrationStatus;
      }
      throw new BadRequestException();
    } catch (err) {
      if (err instanceof Error) throw err;
      throw new BadRequestException();
    }
  }

  // Prelaunch Cover
  public async getPrelaunchStatus() {
    try {
      const prelaunchStatus = await this.securityPolicyModel
        .findOne(
          {level: PolicyLevel.PLATFORM},
          {
            _id: 0,
            prelaunch: {
              status: 1,
            },
          },
        )
        .exec();
      if (prelaunchStatus.prelaunch) {
        return {prelaunchStatus: prelaunchStatus.prelaunch.status};
      }
      throw new BadRequestException();
    } catch (err) {
      if (err instanceof Error) throw err;
      throw new BadRequestException();
    }
  }

  public async validatePrelaunchPassword(preLaunchPwd: string) {
    try {
      const prelaunchPassword = await this.securityPolicyModel
        .findOne(
          {level: PolicyLevel.PLATFORM},
          {
            _id: 0,
            prelaunch: {
              password: 1,
            },
          },
        )
        .exec();
      const storedPwd = prelaunchPassword?.prelaunch?.password;
      const result = await verifyPassword(storedPwd, preLaunchPwd);
      if (prelaunchPassword) {
        return {isPwdValid: result};
      }
      throw new BadRequestException();
    } catch (err) {
      if (err instanceof Error) throw err;
      throw new BadRequestException();
    }
  }

  // Platform Password policy
  public async getPlatformPasswordPolicy() {
    function getMinPwdEffectiveLength(policy: object) {
      // const pwdLength = policy.password.length;
      // return pwdLength;
    }
    try {
      const platformPasswordPolicy = await this.securityPolicyModel
        .findOne(
          {level: PolicyLevel.PLATFORM},
          {
            _id: 0,
            password: {
              length: 1,
            },
            upperCase: {
              length: 1,
            },
            lowerCase: {
              length: 1,
            },
            numerical: {
              length: 1,
            },
            specialChar: {
              length: 1,
            },
          },
        )
        .exec();
      getMinPwdEffectiveLength(platformPasswordPolicy);

      if (platformPasswordPolicy) {
        return {
          passwordLength: platformPasswordPolicy.password.length,
          upperCaseLength: platformPasswordPolicy.upperCase.length,
          lowerCaseLength: platformPasswordPolicy.lowerCase.length,
          numericalLength: platformPasswordPolicy.numerical.length,
          specialCharLength: platformPasswordPolicy.specialChar.length,
        };
      }
      throw new BadRequestException();
    } catch (err) {
      if (err instanceof Error) throw err;
      throw new BadRequestException();
    }
  }

  public async getUserPasswordPolicy() {
    return this.securityPolicyModel
      .findOne(
        {level: PolicyLevel.PLATFORM},
        {
          _id: 0,
          password: {
            length: 1,
          },
          upperCase: {
            length: 1,
          },
          lowerCase: {
            length: 1,
          },
          numerical: {
            length: 1,
          },
          specialChar: {
            length: 1,
          },
          passwordExpirationDays: {
            value: 1,
          },
        },
      )
      .exec();
  }

  public async getSecurityPolicy() {
    return this.securityPolicyModel.findOne({}).exec();
  }

  public async addSecurityPolicy(passwordPolicy: ISecurityPolicy) {
    return this.securityPolicyModel.insertMany([passwordPolicy]);
    // const doc = new this.securityPolicyModel(passwordPolicy);
    // await doc.save();
    // return doc;
  }

  public async updateSecurityPolicy(passwordPolicy: ISecurityPolicy) {
    const policyData = await this.securityPolicyModel.updateOne(
      {_id: passwordPolicy._id},
      {
        $set: {
          ...passwordPolicy,
        },
      },
    );
    if (policyData.acknowledged === true) {
      return this.securityPolicyModel.findOne({}).exec();
    }
  }
}
