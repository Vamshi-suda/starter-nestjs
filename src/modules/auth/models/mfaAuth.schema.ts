import {Schema, mongo} from 'mongoose';
import {MFAModules} from '../enums/MFAModules';
import {uuid} from 'src/utils/uuid';

const MobileOTP = new Schema(
  {
    mobileNumber: String,
    otp: String,
    isVerified: {type: Boolean, default: false},
    isVerifiedByMagicLink: {type: Boolean, default: false},
  },
  {_id: false},
);

const EmailOTP = new Schema(
  {
    address: String,
    otp: String,
    isVerified: {type: Boolean, default: false},
    isVerifiedByMagicLink: {type: Boolean, default: false},
  },
  {_id: false},
);

const OTPDetails = new Schema(
  {
    mobile: {type: MobileOTP},
    email: {type: EmailOTP},
  },
  {_id: false},
);

export const MFAAuth = new Schema({
  guid: {
    type: String,
    unique: true,
    default: uuid,
  },
  otpAuth: OTPDetails,
  expiryDate: Date,
  creationDate: {
    type: Date,
    default: Date.now,
  },
  module: {
    type: String,
    enum: [MFAModules.LOGIN, MFAModules.REGISTRATION, MFAModules.ACCOUNTRECOVERY, MFAModules.PASSWORD],
  },
  magicLinkSession: {type: String, unique: true},
  magicLink: {type: String},
  isMobileVerified: Boolean,
  isEmailVerified: Boolean,
  reason: String,
  glid: String,
  sessionId: String,
  userId: String,
});
