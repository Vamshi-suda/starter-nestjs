import {Document} from 'mongoose';
import {TimeMode} from 'src/utils/enums';
import {IEmailContact} from '@/common/models/emailContact.schema';
import {IPhoneContact} from '@/common/models/phoneContact.schema';

export interface IUser extends Document {
  glid: string;
  guid: string;
  olid?: string;
  name: string;
  contact: {
    email: IEmailContact[];
    mobile: IPhoneContact[];
  };
  location: string;
  preference: Preference;
}

export interface Preference {
  platformUser: boolean;
  theme: string;
  timeZone: string;
  hourFormat: TimeMode;
  language: string;
}

export interface UserMaster {
  glid: string;
  guid: string;
  location: string;
  primaryEmail: string;
  primaryPhone: string;
  password: string;
  dialCode: string;
}
