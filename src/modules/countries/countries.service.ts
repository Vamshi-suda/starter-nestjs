import {Injectable} from '@nestjs/common';
import {InjectModel} from '@nestjs/mongoose';
import {Model} from 'mongoose';
import ICountry from './models/ICountry';
import {ConfigService} from '@nestjs/config';
import axios from 'axios';
import {GeoLocation} from '@/modules/auth/dto/GeoLocation';

@Injectable()
export class CountriesService {
  private readonly geoLocationApiUrl: string;
  constructor(
    @InjectModel('Country') private readonly countriesModel: Model<ICountry>,
    private configService: ConfigService,
  ) {
    this.geoLocationApiUrl = this.configService.get('IP_AND_GEO_LOCATION_API');
  }
  public async getAllCountries() {
    return this.countriesModel.find({}, {_id: 0}).exec();
  }

  async getCountryByIP(ip: string) {
    const url = `${this.geoLocationApiUrl}/${ip}`;
    const res = await axios.get<GeoLocation>(url);
    const ipInfo = res.data;
    return ipInfo.city
      ? {
          city: ipInfo.city.names.en,
          country: ipInfo.country.names.en,
          countryCode: ipInfo.country.iso_code,
          continent: ipInfo.continent.names.en,
          timeZone: ipInfo.location.time_zone,
          subDivisions: ipInfo.subdivisions.map((a) => {
            return {isoCode: a.iso_code, name: a.names.en};
          }),
        }
      : {};
  }
}
