import {Body, Controller, Get, HttpStatus, Param, Post, Req, Res, Response} from '@nestjs/common';
import {RegistrationService} from './registration.service';
import {ApiResponse, ApiTags} from '@nestjs/swagger';
import {UserRegistrationPayload} from './payload/registration.payload';
import {AuthenticateMFAPayload} from '../auth/payload/mfaAuth.payload';
import {Public} from '@/common/decorators/public.decorator';
import {FastifyReply, FastifyRequest} from 'fastify';
import {ConfigService} from '@nestjs/config';

@Controller('registration')
@ApiTags('Registration')
export class RegistrationController {
  cookieDomain: string;
  constructor(
    private readonly registrationService: RegistrationService,
    private readonly configService: ConfigService,
  ) {
    this.cookieDomain = this.configService.get('COOKIE_DOMAIN');
  }
  @Public()
  @Post('validate-registration')
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Validation Success',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation of Registration failed',
  })
  public validateRegistration(@Body() registerDetails: UserRegistrationPayload) {
    return this.registrationService.validateRegistration(registerDetails);
  }

  @Public()
  @Post('authenticate-mfa')
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'MFA Authentication Success',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'MFA Authentication failed',
  })
  public async authenticateEmailOrMobile(@Body() authParams: AuthenticateMFAPayload, @Response({passthrough: true}) res: FastifyReply) {
    return await this.registrationService.authenticateEmailOrMobile(authParams);
  }

  @Get('mfa-status/:mfaAuthId')
  public async registrationMfaStatus(@Param('mfaAuthId') mfaAuthId: string, @Req() req: FastifyRequest, @Res() reply: FastifyReply) {
    const response = await this.registrationService.getRegistrationMFAStatus(mfaAuthId);
    if (response.isEmailVerified || response.isMobileVerified) {
      if (!req.cookies['access-token']) {
        const {jwtToken, refreshToken, session} = await this.registrationService.generateSession(mfaAuthId);
        reply.setCookie('access-token', jwtToken, {
          httpOnly: false,
          path: '/',
          secure: true,
          sameSite: 'none',
          domain: this.cookieDomain || undefined,
        });
        reply.setCookie('refresh-token', refreshToken, {
          httpOnly: false,
          path: '/',
          secure: true,
          sameSite: 'none',
          domain: this.cookieDomain || undefined,
        });
        reply.setCookie('session-id', session, {
          httpOnly: false,
          path: '/',
          secure: true,
          sameSite: 'none',
          domain: this.cookieDomain || undefined,
        });
        reply.setCookie('isplcvalid', 'true', {
          httpOnly: false,
          path: '/',
          secure: true,
          sameSite: 'none',
          domain: this.cookieDomain || undefined,
        });
      }
    }
    reply.send({data: response, succeeded: true});
  }
}
