import {Prop, Schema, SchemaFactory} from '@nestjs/mongoose';
import {uuid} from '@/utils/uuid';

@Schema()
class IpSchema {
  @Prop()
  address: string;
  @Prop({enum: ['ipv4', 'ipv6']})
  type: string;
  @Prop()
  description: string;
  @Prop()
  captcha: boolean;

  @Prop({
    default: uuid,
  })
  guid: string;
}

@Schema()
class PlatformUser {
  @Prop({required: true})
  guid: string;
  @Prop()
  aliasName: string;
  @Prop({min: 0, max: 99})
  aliasId: string;
  @Prop()
  phoneNumber: string;
  @Prop({required: true, default: Date.now})
  createdAt: Date;
  @Prop()
  dialCode: string;
  @Prop()
  countryCode: string;
  @Prop({default: Date.now})
  lastModifiedAt: Date;
  @Prop()
  usedNumbers: [string];
  @Prop([IpSchema])
  ip: [IpSchema];
}

export enum IPType {
  'IPV4' = 'IPv4',
  'IPV6' = 'IPv6',
}

export enum PhoneNumberAliasFields {
  'ALIAS_NAME' = 'aliasName',
  'ALIAS_ID' = 'aliasId',
  'PHONE_NUMBER' = 'phoneNumber',
  'COUNTRY_CODE' = 'countryCode',
  'DIAL_CODE' = 'dialCode',
}
export interface IPlatformUser extends Document {
  guid: string;
  aliasName: string;
  aliasId: string;
  phoneNumber: string;
  countryCode: string;
  dialCode: string;
  createdAt: Date;
  lastModifiedAt: Date;
  usedNumbers: Array<string>;
  ip: Array<IpSchema>;
}

export interface IIpSchema extends Document {
  guid: string;
  address: string;
  type: 'ipv4' | 'ipv6';
  description: string;
  captcha: boolean;
}

export const PlatformUsers = SchemaFactory.createForClass(PlatformUser);
