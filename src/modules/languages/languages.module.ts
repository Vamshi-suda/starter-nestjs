import {Module} from '@nestjs/common';
import {LanguagesService} from './languages.service';
import {LanguagesController} from './languages.controller';
import {MongooseModule} from '@nestjs/mongoose';
import {Language} from './models/languages.schema';

@Module({
  imports: [MongooseModule.forFeature([{name: 'Language', schema: Language}])],
  controllers: [LanguagesController],
  providers: [LanguagesService],
  exports: [LanguagesService],
})
export class LanguagesModule {}
