import {Body, Controller, Get, HttpStatus, Ip, Param} from '@nestjs/common';
import {ApiResponse, ApiTags} from '@nestjs/swagger';
import GlidService from './glid.service';
import {Public} from 'src/common/decorators/public.decorator';

@Controller('glid')
@ApiTags('glid')
export class GlidController {
  constructor(private readonly _glidService: GlidService) {}

  @Get('check-glid-available/:uGlid')
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Glid Availability Check Success',
  })
  isCheckGlidAvailable(@Param('uGlid') uGlid: string) {
    return this._glidService.checkIfGlidIsAvailable(uGlid);
  }
}
