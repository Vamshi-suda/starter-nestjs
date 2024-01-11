import {Schema, Document} from 'mongoose';
import {uuid} from 'src/utils/uuid';
import {LoginAttempt, PreAuthDetails} from '../enums/Session';

export enum AuthenticationState {
  Unidentified = 'unidentified',
  Identified = 'identified',
  Abandoned = 'abandoned',
  Pending = 'pending',
}

export enum SessionState {
  Active = 'Active',
  Inactive = 'Inactive',
}

export const PreAuthentication = new Schema({
  attempt: {
    type: String,
  },
  details: {
    type: String,
  },
  time: {
    type: Date,
  },
});

/**
 * Mongoose Session Schema
 */
export const Session = new Schema(
  {
    guid: {
      type: String,
      unique: true,
      default: uuid,
    },
    glid: {
      type: String,
    },
    userId: {
      type: String,
      // ref: 'User',
    },
    userName: {
      type: String,
    },
    sessionState: {
      type: String,
    },

    authenticationState: {
      type: String,
      default: AuthenticationState.Unidentified,
    },
    sessionStart: {
      type: Date,
      default: Date.now,
    },
    sessionEnd: {
      type: Date,
    },
    preAuthentications: {
      type: [PreAuthentication],
      default: [],
    },
    systemType: {
      type: String,
      default: 'AccelerationN',
    },
    IPAddress: String,
    location: String,
    device: String,
    lastAccessTime: Number,
  },
  {
    toObject: {virtuals: true},
    toJSON: {virtuals: true},
  },
);

/**
 * Mongoose Session Document
 */
export interface ISession extends Document {
  /**
   * unique id
   */
  readonly guid: string;
  /**
   * glid
   */
  readonly glid: string;
  /**
   * userId
   */
  readonly userId: string;
  /**
   * userName
   */
  readonly userName: string;
  /**
   * sessionState
   */
  readonly sessionState: SessionState;
  /**
   * authenticationState
   */
  readonly authenticationState: AuthenticationState;
  /**
   * SessionStart
   */
  readonly sessionStart: Date;

  /**
   *
   */
  readonly sessionEnd?: Date;
  preAuthentications: IPreAuthentication[];
  systemType: string;
  IPAddress: string;
  location: string;
  device: string;
  lastAccessTime: number;
}

export interface IPreAuthentication {
  attempt: LoginAttempt;
  details: PreAuthDetails;
  time: Date;
}

Session.virtual('userDetails', {
  ref: 'User',
  localField: 'userId',
  foreignField: 'guid',
  justOne: true,
});

Session.virtual('authDetails', {
  ref: 'authentication',
  localField: 'guid',
  foreignField: 'session_id',
  justOne: true,
});

// Session.virtual('authDetails', {
//   ref: 'authentication',
//   localField: 'userId',
//   foreignField: 'userId',
//   justOne: true,
// });
