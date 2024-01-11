import {Schema} from 'mongoose';

export const SecurityPolicy = new Schema({
  _id: Schema.Types.ObjectId,
  userId: String,
  organizationId: String,
  password: {
    length: Number,
    status: Boolean,
  },
  upperCase: {
    length: Number,
    status: Boolean,
  },
  numerical: {
    length: Number,
    status: Boolean,
  },
  lowerCase: {
    length: Number,
    status: Boolean,
  },
  specialChar: {
    length: Number,
    status: Boolean,
  },
  passwordExpirationDays: {
    value: Number,
    status: Boolean,
  },
  mfa: {
    value: Number,
    status: Boolean,
  },
  level: String,
  webAppSessionTime: {
    value: Number,
    status: Boolean,
  },
  timeoutOverlay: Number,
  prelaunch: {
    status: Boolean,
    password: String,
  },
  created: Date,
  createdBy: String,
  lastModified: Date,
  lastModifiedBy: String,
});
