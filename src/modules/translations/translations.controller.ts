import {Controller, Get, Param, Query} from '@nestjs/common';
import {TranslationService} from './translation.service';
import {ApiQuery, ApiResponse, ApiTags} from '@nestjs/swagger';
@ApiTags('Translations')
@Controller('translations')
export class TranslationsController {
  constructor(private readonly _translationsService: TranslationService) {}
  @Get(':lang')
  @ApiResponse({status: 200, description: 'translation fetch successful'})
  @ApiQuery({
    name: 'module',
    type: String,
    description: 'module parameter Optional',
    required: false,
  })
  getTranslations(@Param('lang') language: string, @Query('module') moduleName: string = '') {
    return this._translationsService.getTranslations(language, moduleName);
  }
}
