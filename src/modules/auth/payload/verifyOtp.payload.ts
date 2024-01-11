import {ApiProperty} from '@nestjs/swagger';
import {IsAlphanumeric, IsNotEmpty} from 'class-validator';
import {MFAModes} from '../enums/MFAModules';

export class VerifyOtpPayload {
  @ApiProperty()
  @IsAlphanumeric()
  glid?: string;

  @ApiProperty({
    required: true,
  })
  @IsNotEmpty()
  mode: MFAModes;

  @ApiProperty()
  otp: string;

  @ApiProperty()
  mfaId: string;

  @ApiProperty()
  isLink: boolean;
}
