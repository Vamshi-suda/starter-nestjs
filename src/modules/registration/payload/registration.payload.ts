import {ApiProperty} from '@nestjs/swagger';
import {IsEmail, MinLength, MaxLength} from 'class-validator';

export class UserRegistrationPayload {
  @ApiProperty({
    required: true,
  })
  countryCode: string;
  @ApiProperty({
    required: true,
  })
  @MinLength(1)
  @MaxLength(64)
  glid: string;
  @ApiProperty({
    required: true,
  })
  name: string;
  @ApiProperty()
  mobile: string;
  @ApiProperty()
  email: string;
  @ApiProperty({
    required: true,
  })
  languageCode: string;
  @ApiProperty()
  isAuthenticationViaPhoneCall: boolean;
  @ApiProperty({
    required: true,
  })
  dialCode: string;
  @ApiProperty({
    required: true,
  })
  phoneCountryCode: string;
}

export class UserPasswordPayload {
  @ApiProperty({
    required: true,
  })
  password: string;
  @ApiProperty({
    required: true,
  })
  userId: string;
}
