import {Body, Controller, Get, Patch, Query, Req} from '@nestjs/common';
import {IpCaptcha, PhoneNumberAlias} from './payload/platform-testing.payload';
import {ApiQuery} from '@nestjs/swagger';
import {Restricted} from '@/common/decorators/restricted.decorator';
import {AuthRequest} from '../auth/dto/authRequest';
import {PlatformTestingService} from './platform-testing.service';

@Controller('platform-testing')
export class PlatformTestingController {
  constructor(private readonly testingService: PlatformTestingService) {}

  @Restricted()
  @Get('get-ip-addresses')
  getIPAddresses(@Req() req: AuthRequest) {
    return this.testingService.getIpAddresses(req.user.id);
  }

  @Restricted()
  @Get('get-phone-number-alias')
  getPhoneNumberAlias(@Req() req: AuthRequest) {
    return this.testingService.getPhoneNumberAlias(req.user.id);
  }

  @Restricted()
  @Get('is-value-unique')
  @ApiQuery({
    name: 'fieldName',
    type: String,
    description: 'fieldName parameter Required',
    required: true,
  })
  @ApiQuery({
    name: 'value',
    type: String,
    description: 'value parameter Required',
    required: true,
  })
  checkIsValueUnique(@Req() req: AuthRequest, @Query('fieldName') fieldName: string, @Query('value') value: string) {
    return this.testingService.checkIsValueUnique(req.user.id, fieldName, value);
  }

  @Restricted()
  @Get('is-phone-number-unique')
  @ApiQuery({
    name: 'phoneNumber',
    type: String,
    description: 'aliasName parameter Required',
    required: true,
  })
  @ApiQuery({
    name: 'dialCode',
    type: String,
    description: 'phoneNumber parameter Required',
    required: true,
  })
  checkIsPhoneNumberUnique(@Req() req: AuthRequest, @Query('phoneNumber') phoneNumber: string, @Query('dialCode') dialCode: string) {
    return this.testingService.checkIsPhoneNumberUnique(req.user.id, phoneNumber, dialCode);
  }

  @Restricted()
  @Get('search-ip')
  @ApiQuery({
    name: 'text',
    type: String,
    description: 'text parameter Required',
    required: true,
  })
  searchIP(@Req() req: AuthRequest, @Query('text') text: string) {
    return this.testingService.searchIP(req.user.id, text);
  }

  @Restricted()
  @Patch('update-phone-number-alias')
  updatePhoneNumberAlias(@Body() body: PhoneNumberAlias, @Req() req: AuthRequest) {
    return this.testingService.updatePhoneNumberAlias(body, req.user.id);
  }

  @Restricted()
  @Patch('add-ip-address')
  addIPAddress(@Body() body: IpCaptcha, @Req() req: AuthRequest) {
    return this.testingService.addIPAddress(body, req.user.id);
  }

  @Restricted()
  @Patch('edit-ip-address')
  editIPAddress(@Body() body: {guid: string; key: string; value: string}, @Req() req: AuthRequest) {
    return this.testingService.editIPAddress(body, req.user.id);
  }
}
