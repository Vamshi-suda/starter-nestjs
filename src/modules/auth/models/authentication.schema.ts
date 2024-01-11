import {Document, Schema} from 'mongoose';
import {uuid} from 'src/utils/uuid';

export enum AuthStatus {
  CREATED = 1,
  ACTIVATED = 2,
  LOG_OUT = 3,
  CLOSE_SESSION = 4,
  EXPIRED = 5,
  EXPIRED_WITH_FAILED = 6,
}
export interface IAuthentication extends Document {
  guid: string;
  session_id: string;
  accessToken: string;
  refreshToken: string;
  status: AuthStatus;
}

export const AuthenticationSchema = new Schema({
  guid: {
    type: String,
    unique: true,
    default: uuid,
  },
  session_id: {
    type: String,
    unique: true,
  },
  accessToken: {
    type: String,
  },
  refreshToken: {
    type: String,
  },
  status: {
    type: Number,
    enum: [
      AuthStatus.CREATED,
      AuthStatus.ACTIVATED,
      AuthStatus.CLOSE_SESSION,
      AuthStatus.LOG_OUT,
      AuthStatus.EXPIRED,
      AuthStatus.EXPIRED_WITH_FAILED,
    ],
    default: AuthStatus.CREATED,
  },
});
