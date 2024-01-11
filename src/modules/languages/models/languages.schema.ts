import {Schema} from 'mongoose';
import {SupportedStatus, SupportedTypes, TranslationLanguages} from '../enums/LanguagesSupport';

const ISOSchema = new Schema(
  {
    '1': String,
    '2t': String,
    '2b': String,
    '3': String,
  },
  {_id: false},
);

const SupportSchema = new Schema(
  {
    type: {type: String, enum: Object.values(SupportedTypes)},
    status: {type: String, enum: Object.values(SupportedStatus)},
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },
  },
  {_id: false},
);
const TranslationSchema = new Schema(
  {
    language: {type: String, enum: Object.values(TranslationLanguages)},
    value: String,
  },
  {_id: false},
);

export const Language = new Schema({
  name: {type: String, required: true},
  iso639: ISOSchema,
  translation: [TranslationSchema],
  support: [SupportSchema],
  aliases: [String],
  created: Date,
  createdBy: String,
  lastModified: Date,
  lastModifiedBy: String,
});
