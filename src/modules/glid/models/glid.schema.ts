import {Schema} from 'mongoose';

export enum GlidStatus {
  RESERVED = 'Reserved',
  UNRESERVED = 'UnReserved',
  PENDING = 'Pending',
}

/**
 * Mongoose User Schema
 */
export const Glid = new Schema({
  glid: {
    type: String,
    required: true,
    validate: {
      validator: function (value: string) {
        return value.length >= 1 && value.length < 65;
      },
      message: 'Glid should be must be at least 1 character and not exceed 64 characters',
    },
    unique: true,
  },
  status: {
    type: String,
    required: true,
    enum: [GlidStatus.PENDING, GlidStatus.RESERVED, GlidStatus.UNRESERVED],
  },
  createdDate: {
    type: Date,
    default: Date.now,
    required: true,
  },
  lastModified: {
    type: Date,
    default: Date.now,
    required: true,
  },
  mfaAuthIds: [String],
});
