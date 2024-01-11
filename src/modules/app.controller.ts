import {Body, Controller, Get, Logger, Param, Post} from '@nestjs/common';
import {AppService} from './app.service';
import {Public} from '../common/decorators/public.decorator';
import {Restricted} from '../common/decorators/restricted.decorator';
import {EntityDataFieldsPayload, PaginatedEntityDataFieldsPayload} from './payload/entity-data-fields.payload';
import {EmailService} from '@/services/email/email.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly emailService: EmailService,
    private readonly logger: Logger,
  ) {}

  @Public()
  @Get()
  getHello(): string {
    this.logger.verbose(`getHello | ${JSON.stringify({})}`);
    this.logger.debug(`getHello | ${JSON.stringify({})}`);
    this.logger.error(`getHello | ${JSON.stringify({})}`);
    this.logger.warn(`getHello | ${JSON.stringify({})}`);
    this.logger.fatal(`getHello | ${JSON.stringify({})}`);
    this.logger.log(`getHello | ${JSON.stringify({})}`);
    return this.appService.getHello();
  }

  @Restricted()
  @Get('getEntities')
  getEntities(): string[] {
    return this.appService.getEntities();
  }

  @Restricted()
  @Get('getEntityDetails/:entityName')
  getEntityDetails(@Param('entityName') entityName: string) {
    return this.appService.getEntityDetails(entityName);
  }

  @Restricted()
  @Post('getEntityData')
  getEntityData(@Body() payload: EntityDataFieldsPayload) {
    return this.appService.getEntityData(payload);
  }

  @Restricted()
  @Post('getPaginatedEntityData')
  getPaginatedEntityData(@Body() payload: PaginatedEntityDataFieldsPayload) {
    return this.appService.getPaginatedEntityData(payload);
  }

  @Restricted()
  @Post('sendNotificationEmail')
  sendNotificationEmail(@Body() payload: {type: string; recipient: string; otp: string; magicLink: string}) {
    switch (payload.type) {
      case 'CONFIRM_MY_EMAIL':
        return this.emailService.sendOtpMailForConfirmEmail(payload.recipient, payload.otp, payload.magicLink);
      case 'SIGN_ME_IN':
        return this.emailService.sendOtpMailForAuth(payload.recipient, payload.otp, payload.magicLink);
    }
  }
}
