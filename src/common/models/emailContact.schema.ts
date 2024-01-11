import {Schema} from 'mongoose';
import {ContactClassification} from './enums';

const EmailContact = new Schema(
  {
    address: {type: String, required: true},
    isVerified: {type: Boolean},
    classification: {
      type: String,
      enum: [ContactClassification.PERSONAL, ContactClassification.BUSINESS, ContactClassification.UNKNOWN],
    },
    isAuthenticationEnabled: Boolean,
    isPrimary: Boolean,
  },
  {_id: false},
);
export default EmailContact;

export interface IEmailContact {
  address: string;
  isVerified: boolean;
  classification: ContactClassification;
  isAuthenticationEnabled: boolean;
  isPrimary: boolean;
}
