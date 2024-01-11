import {Schema} from 'mongoose';
import {TimeMode} from 'src/utils/enums';
import EmailContact from '@/common/models/emailContact.schema';
import PhoneContact from '@/common/models/phoneContact.schema';
import {uuid} from '@/utils/uuid';

export enum UserDeleteStatus {
  PendingDeletion = 'Pending Deletion',
  Deleted = 'Deleted',
  Recovered = 'Recovered',
}

const Preference = new Schema(
  {
    platformUser: Boolean,
    theme: String,
    timeZone: String,
    hourFormat: {
      type: Number,
      enum: [TimeMode.HR_12, TimeMode.HR_24],
      default: TimeMode.HR_12,
    },
    language: String,
  },
  {_id: false},
);

export const User = new Schema({
  glid: {unique: true, type: String, required: true},
  guid: {type: String, default: uuid, unique: true},
  location: String,
  olid: {type: String},
  name: {type: String, maxLength: 120, required: true},
  contact: {
    email: [EmailContact],
    mobile: [PhoneContact],
  },
  password: {type: String},
  passwordExpiryDate: {type: Date, default: Date.now},
  preference: Preference,
  deleteStatus: {
    type: String,
    enum: [UserDeleteStatus.PendingDeletion, UserDeleteStatus.Deleted, UserDeleteStatus.Recovered],
  },
  deleteDate: {type: Date},
});

export const UserMaster = new Schema({
  glid: {unique: true, type: String, required: true},
  guid: {type: String, default: uuid, unique: true},
  location: String,
  primaryEmail: String,
  primaryPhone: String,
  password: {type: String},
  dialCode: {type: String},
});
