import {Schema} from 'mongoose';
import {SupportedStatus, SupportedTypes, TranslationLanguages} from '../enums/LanguagesSupport';

interface ISO {
  '1': string;
  '2t': string;
  '2b': string;
  '3': string;
}

interface Support {
  type: SupportedTypes;
  status: SupportedStatus;
  startDate: {
    type: Date;
  };
  endDate: {
    type: Date;
  };
}

interface Translations {
  language: TranslationLanguages;
  value: string;
}

export default interface ILanguage {
  _id: Schema.Types.ObjectId;
  name: {type: string; required: true};
  iso639: ISO;
  tanslation: [Translations];
  support: [Support];
  aliases: [string];
  created: Date;
  createdBy: string;
  lastModified: Date;
  lastModifiedBy: string;
}
