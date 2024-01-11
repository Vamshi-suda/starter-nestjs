import {Injectable} from '@nestjs/common';
import {InjectModel} from '@nestjs/mongoose';
import {Model} from 'mongoose';
import {IPlatformUser, PhoneNumberAliasFields} from './platform-testing.model';
import {IpCaptcha, PhoneNumberAlias} from './payload/platform-testing.payload';

@Injectable()
export class PlatformTestingService {
  constructor(
    @InjectModel('PlatformUsers')
    private readonly platformUsers: Model<IPlatformUser>,
  ) {}

  async updatePhoneNumberAlias(body: PhoneNumberAlias, userId: string) {
    const isUnique = await this.checkIsValueUnique(userId, PhoneNumberAliasFields.ALIAS_ID, body.aliasId);
    if (!isUnique) {
      await this.platformUsers.updateOne({aliasId: body.aliasId}, {$set: {aliasId: ''}});
    }
    const result = await this.platformUsers.updateOne(
      {guid: userId},
      {
        $set: {
          aliasId: body.aliasId,
          aliasName: body.aliasName,
          phoneNumber: body.phoneNumber,
          dialCode: body.dialCode,
          countryCode: body.countryCode,
        },
      },
      {upsert: true},
    );
    return result;
  }

  async addIPAddress(body: IpCaptcha, userId: string) {
    const result = await this.platformUsers.updateOne(
      {guid: userId},
      {
        $push: {
          ip: {
            address: body.address,
            type: body.type,
            description: body.description,
            captcha: false,
          },
        },
      },
      {upsert: true},
    );
    return result;
  }

  async editIPAddress(body: {guid: string; key: string; value: string}, userId: string) {
    const key = `ip.$.${body.key}`;
    const result = await this.platformUsers.updateOne(
      {
        guid: userId,
        'ip.guid': body.guid,
      },
      {
        $set: {
          [key]: body.value,
        },
      },
    );
    return result;
  }

  async getIpAddresses(userId: string) {
    const result = await this.platformUsers.findOne({guid: userId}, {ip: 1});
    return result;
  }
  async getPhoneNumberAlias(userId: string) {
    const result = await this.platformUsers.findOne(
      {guid: userId},
      {
        aliasName: 1,
        phoneNumber: 1,
        countryCode: 1,
        dialCode: 1,
        aliasId: 1,
        usedNumbers: 1,
        _id: 0,
      },
    );
    return result;
  }
  async checkIsValueUnique(userId: string, fieldName: string, value: string) {
    const nameExp = new RegExp(`^${value}$`, 'i');
    const result = await this.platformUsers.find({
      guid: {$ne: userId},
      [fieldName]: nameExp,
    });
    if (result.length) return false;
    else return true;
  }

  async checkIsPhoneNumberUnique(userId: string, phoneNumber: string, dialCode: string) {
    const result = await this.platformUsers.find({
      guid: {$ne: userId},
      phoneNumber: phoneNumber,
      dialCode: '+' + dialCode.trim(),
    });
    if (result.length) return true;
    else return false;
  }

  async searchIP(userId: string, text: string) {
    const textExp = new RegExp(text, 'i');
    const result = await this.platformUsers.aggregate([
      {
        $match: {
          guid: userId,
        },
      },
      {
        $unwind: '$ip',
      },
      {
        $match: {
          $or: [{'ip.description': textExp}, {'ip.address': textExp}, {'ip.type': textExp}],
        },
      },
      {
        $group: {
          _id: '$guid',
          ip: {
            $push: '$ip',
          },
        },
      },
    ]);
    if (result.length > 0) {
      return result[0].ip;
    }
    return result;
  }
}
