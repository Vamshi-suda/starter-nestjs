import {ApiProperty} from '@nestjs/swagger';
import {IsAlphanumeric, IsNotEmpty} from 'class-validator';

/**
 * login types
 */
export enum MFAAuthType {
  MOBILE = 'Mobile',
  EMAIL = 'Email',
  PHONECALL = 'PhoneCall',
}

/**
 * Login Payload Class
 */
export class LoginPayload {
  /**
   * Username field
   */
  @ApiProperty({
    required: true,
  })
  glid: string;

  /**
   * Password field
   */
  @ApiProperty({
    required: true,
  })
  password: string;

  // @ApiProperty({
  //   required: true,
  // })
  // session_id: string;
}

export class LoginMfaOtpPayload {
  /**
   * mfa auth type field
   */
  @ApiProperty({
    required: true,
    enum: MFAAuthType,
  })
  @IsNotEmpty()
  authType: MFAAuthType;

  /**
   * otp field
   */
  @ApiProperty({
    required: true,
  })
  glid: string;

  /**
   * otp field
   */
  @ApiProperty({
    required: true,
  })
  otp: string;

  /**
   * mfa  id  field
   */
  @ApiProperty({
    required: true,
  })
  mfaId: string;

  // @ApiProperty({
  //   required: true,
  // })
  // session_id: string;

  // @ApiProperty()
  // isLink: boolean;
}

export class VerifyAuth {
  /**
   * auth ref after successful login
   */
  @ApiProperty({
    required: true,
  })
  @IsNotEmpty()
  authRef: string;
}

export class LoginInMagicLink {
  @ApiProperty({
    required: true,
  })
  @IsNotEmpty()
  authRef: string;

  @ApiProperty({
    required: true,
  })
  @IsNotEmpty()
  guid: string;

  @ApiProperty({
    required: true,
  })
  @IsNotEmpty()
  mode: 'e' | 'p';
}

export class InitialAuthPayload {
  @ApiProperty({
    required: true,
  })
  session_id: string;

  @ApiProperty({
    required: true,
  })
  auth_id: string;
}
