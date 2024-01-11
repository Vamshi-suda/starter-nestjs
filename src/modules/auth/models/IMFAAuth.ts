import {Document} from 'mongoose';
import {MFAModules} from '../enums/MFAModules';

export interface IAuthOTP {
  otp: string;
  isVerified?: boolean;
  isVerifiedByMagicLink?: boolean;
}
export interface IMobileOTP extends IAuthOTP {
  mobileNumber: string;
}

export interface IEmailOTP extends IAuthOTP {
  address: string;
}

export interface IOTPDetails {
  mobile: IMobileOTP;
  email: IEmailOTP;
}

export default interface IMFAAuth extends Document {
  guid: string;
  otpAuth: IOTPDetails;
  expiryDate: string;
  creationDate: Date;
  module: MFAModules;
  reason: string;
  exp: number;
  glid: string;
  magicLinkSession: string;
  magicLink: string;
  sessionId: string;
  userId: string;
}

export type MFAMode = 'email' | 'message' | 'call';
