import {BadRequestException, Injectable} from '@nestjs/common';
import {InjectModel} from '@nestjs/mongoose';
import {Model} from 'mongoose';
import ILanguage from './models/ILanguage';

@Injectable()
export class LanguagesService {
  constructor(@InjectModel('Language') private readonly languagesModel: Model<ILanguage>) {}
  public async getAllLanguages() {
    //TO DO: Remove References and duplicate language data in country
    return this.languagesModel.find().exec();
  }
}
