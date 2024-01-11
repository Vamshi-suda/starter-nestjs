import {Schema} from 'mongoose';

export const AttemptedRegistrations = new Schema({
  mfaSessionId: {type: String, unique: true},
  countryCode: String,
  glid: String,
  name: String,
  email: String,
  mobile: String,
  languageCode: String,
  dialCode: String,
  phoneCountryCode: String,
});
