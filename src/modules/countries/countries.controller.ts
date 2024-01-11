import {Controller, Get, Ip, Query, Req} from '@nestjs/common';
import {CountriesService} from './countries.service';
import {ApiTags} from '@nestjs/swagger';
import {Public} from 'src/common/decorators/public.decorator';
import {AuthRequest} from '@/modules/auth/dto/authRequest';

const demoIPs = ['209.85.231.104', '100.42.240.2', '101.166.83.38'];
@Controller('countries')
@ApiTags('country')
export class CountriesController {
  constructor(private readonly countriesService: CountriesService) {}

  @Public()
  @Get()
  getAllCountries() {
    return this.countriesService.getAllCountries();
  }

  @Public()
  @Get('ip')
  async getCountryByIP(@Req() req: AuthRequest, @Query('ip') ip: string = '', @Ip() rip) {
    if (!ip) {
      const forwarded = req.headers['x-forwarded-for'];
      ip = forwarded ? forwarded[0] : req.socket.remoteAddress;
    }
    // if (ip === '127.0.0.1' || ip === '::1') {
    //   ip = demoIPs[Math.floor(Math.random() * 100) % demoIPs.length];
    // }
    //ip = ip.split(':')[0];
    console.log('decorator:', rip, 'request Ip address', ip, '___req.ip:', req.ip);
    return await this.countriesService.getCountryByIP(ip);
  }
}
