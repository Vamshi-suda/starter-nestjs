import {Module} from '@nestjs/common';
import {CountriesService} from './countries.service';
import {CountriesController} from './countries.controller';
import {MongooseModule} from '@nestjs/mongoose';
import {Country} from './models/countries.schema';
import {ConfigModule} from '@nestjs/config';

@Module({
  imports: [MongooseModule.forFeature([{name: 'Country', schema: Country}]), ConfigModule],
  controllers: [CountriesController],
  providers: [CountriesService],
  exports: [CountriesService],
})
export class CountriesModule {}
