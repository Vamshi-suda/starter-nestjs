import {Body, Controller, Get, HttpStatus, Param, Patch, Post, Req, Res} from '@nestjs/common';
import {ApiResponse, ApiTags} from '@nestjs/swagger';
import {SecurityPolicyService} from './security-policy.service';
import {FastifyReply} from 'fastify';
import {PrelaunchRequest} from './dto/preLaunchRequest';
import {PrelaunchPassword} from './payload/prelaunch.payload';
import {ConfigService} from '@nestjs/config';

@Controller('securityPolicy')
@ApiTags('SecurityPolicy')
export class SecurityPolicyController {
  cookieDomain: string;
  constructor(
    private readonly securityPolicyService: SecurityPolicyService,
    private readonly configService: ConfigService,
  ) {
    this.cookieDomain = this.configService.get('COOKIE_DOMAIN');
    console.log('this.cookieDomain', this.cookieDomain);
  }

  @Get('/get-global-registration-status')
  getGlobalRegistrationStatus() {
    return this.securityPolicyService.getGlobalRegistrationStatus();
  }
  @Get('/get-prelaunch-status')
  getPrelaunchStatus() {
    return this.securityPolicyService.getPrelaunchStatus();
  }

  @Post('/validate-prelaunch-password/')
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Password verification successful',
  })
  async validatePrelaunchPassword(@Res() res: FastifyReply, @Req() req: PrelaunchRequest, @Body() body: PrelaunchPassword) {
    try {
      const val = await this.securityPolicyService.validatePrelaunchPassword(body.password);
      if (val.isPwdValid) {
        res.setCookie('isplcvalid', 'true', {
          httpOnly: false,
          path: '/',
          secure: true,
          sameSite: 'none',
          domain: this.cookieDomain || undefined,
        });
        return res.send(val);
      }
      res.send(val);
    } catch (err) {
      res.status(400);
      return res.send({
        message: err.message,
      });
    }
  }

  @Get('/get-platform-password-policy')
  getPlatformPasswordPolicy() {
    return this.securityPolicyService.getPlatformPasswordPolicy();
  }

  @Get('/get-user-password-policy')
  getUserPasswordPolicy() {
    return this.securityPolicyService.getUserPasswordPolicy();
  }

  @Get('/')
  getSecurityPolicy() {
    return this.securityPolicyService.getSecurityPolicy();
  }

  @Patch()
  updateSecurityPolicy(@Body() data) {
    return this.securityPolicyService.updateSecurityPolicy(data.data);
  }

  @Post()
  addSecurityPolicy(@Body() data) {
    return this.securityPolicyService.addSecurityPolicy(data);
  }
}
