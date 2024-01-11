import {ApiProperty} from '@nestjs/swagger';
import {MFAModes} from '../enums/MFAModules';
import {IsNotEmpty} from 'class-validator';

export class AuthenticateMFAPayload {
  @ApiProperty({required: true})
  mfaAuthId: string;
  @ApiProperty()
  otp: string;
  @ApiProperty()
  magicLinkMode: MFAModes;
}

export type MFAType = 'email' | 'message' | 'phone';

export enum FORGOT_GLID_RECOVER_TYPE {
  EMAIL = 'email',
  MESSAGE = 'message',
}

export class ForgotPasswordMFA {
  @ApiProperty({
    required: true,
  })
  @IsNotEmpty()
  glid: string;

  @ApiProperty({
    required: true,
  })
  @IsNotEmpty()
  mfaType: MFAType;

  // @ApiProperty({
  //   required: true,
  // })
  // @IsNotEmpty()
  // session_id: string;
}

export class ChangePassowrdMFA {
  @ApiProperty({
    required: true,
  })
  @IsNotEmpty()
  mfaType: MFAType;
}

export class ForgotPasswordMFAValidation {
  @ApiProperty({
    required: true,
  })
  @IsNotEmpty()
  glid: string;

  @ApiProperty({
    required: true,
  })
  @IsNotEmpty()
  guid: string;

  // @ApiProperty({
  //   required: true,
  // })
  // @IsNotEmpty()
  // session_id: string;

  @ApiProperty({
    required: true,
  })
  @IsNotEmpty()
  otp: string;
}

export class ChangePasswordMFAValidation {
  @ApiProperty({
    required: true,
  })
  @IsNotEmpty()
  otp: string;
}

export class ResetPassword {
  @ApiProperty({
    required: true,
  })
  @IsNotEmpty()
  password: string;
}

export class changePassword {
  @ApiProperty({
    required: true,
  })
  @IsNotEmpty()
  oldPassword: string;

  @ApiProperty({
    required: true,
  })
  @IsNotEmpty()
  newPassword: string;
}

export class ForgotGLID {
  @ApiProperty({
    required: true,
  })
  @IsNotEmpty()
  type: FORGOT_GLID_RECOVER_TYPE;

  @ApiProperty({
    required: true,
  })
  @IsNotEmpty()
  value: string;
}
export class recoveryRequest {
  @ApiProperty()
  glid: string;
  @ApiProperty()
  email: string;
  @ApiProperty()
  mobile: string;
}
