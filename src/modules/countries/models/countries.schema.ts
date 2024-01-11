import {Schema} from 'mongoose';
import {CountrySupportedStatus, CountrySupportedTypes} from '../enums/CountrySupport';

const CountryISOSchema = new Schema(
  {
    alpha_3: String,
    alpha_2: String,
    numericCode: String,
  },
  {_id: false},
);

const SupportSchema = new Schema(
  {
    type: {type: String, enum: Object.values(CountrySupportedTypes)},
    status: {type: String, enum: Object.values(CountrySupportedStatus)},
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },
  },
  {_id: false},
);
const TimeZoneSchema = new Schema(
  {
    shortName: String,
    longName: String,
    utcCode: String,
    polCode1: String,
    polCode2: String,
    link: String,
  },
  {_id: false},
);
const SubLanguageSchema = new Schema(
  {
    id: String,
    isSupported: String,
  },
  {_id: false},
);
const CountryTranslationSchema = new Schema(
  {
    languageName: String,
    preferredName: String,
    legalName: String,
  },
  {_id: false},
);

const TelephoneSchema = new Schema(
  {
    dialCode: String,
    stringFormats: [String],
    platformTesting: String,
  },
  {_id: false},
);

export const Country = new Schema({
  countryPreferredName: {type: String, required: true},
  countryLegalName: {type: String, required: true},
  countryCode: {type: String, required: true, unique: true},
  iso_3166_1: CountryISOSchema,
  countryAliases: [String],
  support: [SupportSchema],
  timeZoneURL: {type: String},
  timeZone: [TimeZoneSchema],
  language: [SubLanguageSchema],
  translation: [CountryTranslationSchema],
  telephone: TelephoneSchema,
  created: Date,
  createdBy: String,
  lastModified: Date,
  lastModifiedBy: String,
});
