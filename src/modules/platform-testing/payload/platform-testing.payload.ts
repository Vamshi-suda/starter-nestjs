import {ApiProperty} from '@nestjs/swagger';
import {IPType} from '../platform-testing.model';

export class PhoneNumberAlias {
  @ApiProperty({required: true})
  userId: string;

  @ApiProperty({required: true})
  aliasName: string;

  @ApiProperty({required: true})
  aliasId: string;

  @ApiProperty({required: true})
  phoneNumber: string;

  @ApiProperty({required: true})
  dialCode: string;

  @ApiProperty({required: true})
  countryCode: string;
}

export class IpCaptcha {
  @ApiProperty({required: true})
  userId: string;

  @ApiProperty({required: true})
  address: string;

  @ApiProperty({required: true})
  type: IPType;

  @ApiProperty({})
  description: string;
}
