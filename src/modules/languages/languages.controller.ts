import {BadRequestException, Controller, Get} from '@nestjs/common';
import {LanguagesService} from './languages.service';
import {ApiTags} from '@nestjs/swagger';
import {InjectModel} from '@nestjs/mongoose';

import {Model} from 'mongoose';
import ILanguage from './models/ILanguage';

@Controller('languages')
@ApiTags('language')
export class LanguagesController {
  constructor(
    private readonly languagesService: LanguagesService,
    @InjectModel('Language') private languageModel: Model<ILanguage>,
  ) {}

  @Get()
  getAllLanguages() {
    return this.languagesService.getAllLanguages();
  }
}
