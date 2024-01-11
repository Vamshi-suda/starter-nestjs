import {Document} from 'mongoose';
import {GlidStatus} from './glid.schema';

export default interface Glid extends Document {
  status: GlidStatus;
  glid: string;
  createdDate: Date;
  lastModified: Date;
}
