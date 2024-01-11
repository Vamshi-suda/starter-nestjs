import {Schema} from 'mongoose';
import {ContactClassification} from './enums';

const PhoneContact = new Schema(
  {
    number: {type: String, required: true},
    isVerified: {type: Boolean},
    classification: {
      enum: [ContactClassification.BUSINESS, ContactClassification.PERSONAL, ContactClassification.UNKNOWN],
    },
    isAuthenticationEnabled: Boolean,
    isPrimary: Boolean,
    dialCode: String,
    countryCode: String,
  },
  {_id: false},
);

export default PhoneContact;

export interface IPhoneContact {
  number: string;
  isVerified: boolean;
  classification: ContactClassification;
  isAuthenticationEnabled: boolean;
  isPrimary: boolean;
  countryCode: string;
  dialCode: string;
}
