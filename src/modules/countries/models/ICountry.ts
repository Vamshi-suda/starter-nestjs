import {Schema} from 'mongoose';
import {CountrySupportedStatus, CountrySupportedTypes} from '../enums/CountrySupport';

export default interface ICountry {
  _id: Schema.Types.ObjectId;
  countryCode: string;
  countryPreferredName: string;
  countryLegalName: string;
  iso3166_1: ISO_3166_1;
  countryAliases: [string];
  support: [SupportInCountry];
  timeZoneURL: string;
  timeZone: [TimeZone];
  language: [SubLanguage];
  translation: [CountryTranslation];
  telephone: Telephone;
}
interface TimeZone {
  shortName: string;
  longName: string;
  utcCode: string;
  polCode1: string;
  polCode2: string;
  link: string;
}
interface SubLanguage {
  id: string;
  isSupported: string;
}
interface CountryTranslation {
  languageName: string;
  preferredName: string;
  legalName: string;
}
interface Telephone {
  dialCode: string;
  stringFormats: [string];
  platformTesting: string;
}
interface SupportInCountry {
  type: CountrySupportedTypes;
  status: CountrySupportedStatus;
  startDate: Date;
  endDate: Date;
}

interface ISO_3166_1 {
  alpha_3: string;
  alpha_2: string;
  numericCode: string;
}
