import {BadRequestException, Injectable} from '@nestjs/common';
import {InjectModel} from '@nestjs/mongoose';
import {Model} from 'mongoose';
import {ITranslations} from './models/translation.schema';

@Injectable()
export class TranslationService {
  constructor(
    @InjectModel('Translations')
    private readonly _translationsModel: Model<ITranslations>,
  ) {}
  public async getTranslations(language: string, module: string) {
    const translationsResponse = await this._translationsModel.find({language: language.trim().toLowerCase()}, {_id: 0, content: 1}).exec();
    if (!translationsResponse.length) {
      return new BadRequestException('Language not supported');
    }
    if (!module) return translationsResponse;
    const moduleContent = translationsResponse[0].content[module.trim()];
    if (module === 'common') return moduleContent;
    if (!moduleContent) return [];
    moduleContent['common'] = translationsResponse[0].content['common'];
    return moduleContent;
  }
}
