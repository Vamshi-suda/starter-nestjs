import {Module} from '@nestjs/common';
import {MongooseModule} from '@nestjs/mongoose';
import {Translations, TranslationSchema} from './models/translation.schema';
import {TranslationsController} from './translations.controller';
import {TranslationService} from './translation.service';

@Module({
  imports: [MongooseModule.forFeature([{name: 'Translations', schema: Translations}])],
  controllers: [TranslationsController],
  providers: [TranslationService],
})
export class TranslationsModule {}
