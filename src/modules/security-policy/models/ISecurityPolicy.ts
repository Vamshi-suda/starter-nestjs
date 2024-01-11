import {Schema} from 'mongoose';
import {policyStatus} from '../enums/securityPolicy';

export default interface ISecurityPolicy {
  _id: Schema.Types.ObjectId;
  userId: string;
  organizationId: string;
  password: {
    length: number;
    status: policyStatus;
  };
  upperCase: {
    length: number;
    status: policyStatus;
  };
  lowerCase: {
    length: number;
    status: policyStatus;
  };
  numerical: {
    length: number;
    status: policyStatus;
  };
  specialChar: {
    length: number;
    status: policyStatus;
  };
  passwordExpirationDays: {
    value: number;
    status: string;
  };
  mfa: {
    value: boolean;
    status: string;
  };
  webAppSessionTime: {
    value: number;
    status: policyStatus;
  };
  timeoutOverlay: number;
  prelaunch: {
    status: boolean;
    password: string;
  };

  globalRegistration: boolean;
  created: Date;
  createdBy: string;
  lastModified: Date;
  lastModifiedBy: string;
}
