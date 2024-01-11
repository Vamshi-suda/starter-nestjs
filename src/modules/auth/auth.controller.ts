import {Controller, Body, Post, Logger, Get, Param, Query, Req, Res, BadRequestException} from '@nestjs/common';
import {ApiBearerAuth, ApiResponse, ApiTags} from '@nestjs/swagger';
import {AuthService} from './auth.service';
import {InitialAuthPayload, LoginInMagicLink, LoginMfaOtpPayload, LoginPayload, VerifyAuth} from './payload/login.payload';
import {Public} from 'src/common/decorators/public.decorator';
import {Restricted} from 'src/common/decorators/restricted.decorator';
import {ForgotGLID, ForgotPasswordMFA, ForgotPasswordMFAValidation, ResetPassword, changePassword} from './payload/mfaAuth.payload';
import {MFAMode} from './models/IMFAAuth';
import {AuthRequest} from './dto/authRequest';
import {FastifyReply} from 'fastify';
import {ISession, SessionState} from './models/session.model';
import {CloseSession, CreateSession} from './payload/session.payload';
import {AuthStatus} from './models/authentication.schema';
import {DoNotUpdateSession} from '@/common/decorators/do-not-update-session.decorator';
import {ConfigService} from '@nestjs/config';
import {CountriesService} from '@/modules/countries/countries.service';

const demoIPs = ['209.85.231.104', '207.46.170.123', '72.30.2.43', '66.220.149.25', '208.80.152.2', '143.166.83.38', '128.242.245.116'];

/**
 * Authentication Controller
 */
@Controller('auth')
@ApiTags('authentication')
export class AuthController {
  cookieDomain: string;
  /**
   * Constructor
   * @param {AuthService} authService authentication service
   * @param {UserService} userService user service
   * @param {Logger} Logger logger
   */
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
    private readonly countryService: CountriesService,
  ) {
    this.cookieDomain = this.configService.get('COOKIE_DOMAIN');
  }

  /**
   * create unidentified session
   */
  @Public()
  @Post('create-session')
  async createSession(@Req() req: AuthRequest, @Body() body: CreateSession, @Res({passthrough: false}) res: FastifyReply) {
    const sessionId = req.sessionId;
    if (sessionId) {
      const session: ISession = await this.authService.getSession(sessionId);
      if (session && session.sessionState !== SessionState.Inactive) return session;
    }
    let ip = req.ip;
    if (ip === '::1') {
      ip = demoIPs[Math.floor(Math.random() * 100) % demoIPs.length];
    }
    let location = '';
    const ipRes = await this.countryService.getCountryByIP(ip);
    if (ipRes) {
      location = `${ipRes.city}, ${ipRes.subDivisions[0].isoCode}, ${ipRes.country}`;
    }
    const session = await this.authService.createSession(ip, location, body);
    // return await
    res
      .setCookie('session-id', session.guid, {
        httpOnly: false,
        path: '/',
        secure: true,
        sameSite: 'none',
        domain: this.cookieDomain || undefined,
      })
      .send({
        message: 'created session',
      });
  }

  @DoNotUpdateSession()
  @Post('/logout')
  async logout(@Req() req: AuthRequest) {
    return await this.authService.endSession(req.sessionId, AuthStatus.LOG_OUT);
  }

  @Post('/close-session')
  async endSession(@Req() req: AuthRequest, @Body() body: CloseSession) {
    if (req.sessionId === body.sessionId) {
      throw new BadRequestException("you can't close current session");
    }
    return await this.authService.endSession(body.sessionId, AuthStatus.CLOSE_SESSION);
  }

  @Restricted()
  @Post('/close-all-sessions')
  async endAllSessions(@Req() req: AuthRequest) {
    return await this.authService.endAllSessions(req.sessionId, req.user.id);
  }

  /**
   * Login route to validate and create tokens for users
   * @param {LoginPayload} payload the login dto
   */
  @Post('login')
  @ApiResponse({status: 201, description: 'Login Completed'})
  @ApiResponse({status: 400, description: 'Bad Request'})
  @ApiResponse({status: 401, description: 'Unauthorized'})
  async login(@Req() req: AuthRequest, @Body() payload: LoginPayload) {
    return await this.authService.loginWithPassword(payload, req.sessionId);
  }

  /**
   * Login with mfa
   * @param {LoginMfaOtpPayload} payload the login dto
   */
  @Post('login-with-mfa-otp')
  @ApiResponse({status: 201, description: 'Login Completed'})
  @ApiResponse({status: 400, description: 'Bad Request'})
  @ApiResponse({status: 401, description: 'Unauthorized'})
  async loginWithMFA(@Req() req: AuthRequest, @Body() payload: LoginMfaOtpPayload) {
    return await this.authService.loginWithMFA(payload, req.sessionId);
  }

  /**
   * validate and create tokens for users
   * @param {VerifyAuth} payload the login dto
   */
  @Post('verify-login-auth-ref')
  @ApiResponse({status: 201, description: 'Login Completed'})
  @ApiResponse({status: 400, description: 'Bad Request'})
  @ApiResponse({status: 401, description: 'Unauthorized'})
  async verifyAuthRef(@Body() payload: VerifyAuth) {
    await this.authService.verifyLoginAuthRef(payload.authRef);
  }

  /**
   *
   * @param {LoginInMagicLink} payload
   */

  @Post('verify-login-magic-link')
  @ApiResponse({status: 201, description: 'Login Completed'})
  async verifyLoginMagicLink(@Body() payload: LoginInMagicLink) {
    await this.authService.verifyLoginMagicLink(payload.authRef, payload.guid, payload.mode);
  }

  /**
   *
   * @param session_id
   * @returns
   */
  @DoNotUpdateSession()
  @Get('check-session-state')
  @ApiResponse({status: 201, description: 'Login Completed'})
  @ApiResponse({status: 400, description: 'Bad Request'})
  @ApiResponse({status: 401, description: 'Unauthorized'})
  async checkSessionState(@Req() req: AuthRequest) {
    return await this.authService.checkSessionActiveState(req.sessionId);
  }

  /**
   * to get initial token details after login
   * @param {InitialAuthPayload} payload
   */
  @Post('get-initial-token-details')
  async getInitialAuthValue(@Req() req: AuthRequest, @Body() payload: InitialAuthPayload) {
    // this.handleCookie(req);
    return await this.authService.getInitialAuthValue(payload.session_id, payload.auth_id);
  }

  /**
   * to get new token set
   * @param req
   * @returns
   */
  @Public()
  @Post('get-token')
  async getToken(@Req() req: AuthRequest) {
    const [type, token] = req.headers.authorization?.split(' ') ?? [];
    const sessionId = typeof req.headers.sessionid === 'string' ? req.headers.sessionid : (undefined as string);
    return await this.authService.getNewToken(sessionId, token);
  }

  /**
   * check a GLID is exist or not
   * @param glid
   * @returns
   */
  @Public()
  @ApiResponse({status: 200, description: 'check GLID Request Received'})
  @ApiResponse({status: 400, description: 'check GLID Request Failed'})
  @Get('is-glid-valid/:glid')
  async isGLIDValid(@Param('glid') glid: string) {
    const user = await this.authService.getUserWithGlid(glid);
    return {
      ...(user ? {name: user.name} : undefined),
      valid: !!user,
    };
  }

  /**
   *
   * @param glid
   * @param type
   * @param session_id
   * @returns
   */
  @Public()
  @Get('generate-otp/:glid')
  @ApiResponse({status: 200, description: 'generate Request Received'})
  @ApiResponse({status: 400, description: 'generate Request Failed'})
  async generateLoginOtp(@Req() req: AuthRequest, @Param('glid') glid: string, @Query('type') type: MFAMode) {
    return await this.authService.generateLoginOtp(glid, type, req.sessionId);
  }

  /**
   *
   * @param sessionId
   * @returns
   */
  @Public()
  @Get('mfa-status/:sessionId')
  async getMFAAuthStatus(@Req() req: AuthRequest, @Param('sessionId') sessionId) {
    return await this.authService.getMFAStatus(sessionId);
  }

  /**
   *
   * @param body
   * @returns
   */
  @Public()
  @Post('send-forgot-password-mfa')
  async sendForGotMFA(@Req() req: AuthRequest, @Body() body: ForgotPasswordMFA) {
    return this.authService.sendMFAtoGlidUser(body.glid, req.sessionId, body.mfaType, 'forgot-password');
  }

  /**
   *
   * @param glid
   * @returns
   */
  @Public()
  @Get('get-verified-mfas/:glid')
  async getVerifiedMFAs(@Req() req: AuthRequest, @Param('glid') glid: string) {
    return this.authService.getUserMFAsByGlid(glid);
  }

  @Public()
  @Get('glid-has-password-flow/:glid')
  async verifyPasswordFlow(@Param('glid') glid: string) {
    return await this.authService.glidHasPasswordFlow(glid);
  }

  /**
   *
   * @param {ForgotPasswordMFAValidation} body
   * @returns
   */
  @Public()
  @Post('validate-forgot-password-mfa')
  async validateForgotPasswordMFA(@Req() req: AuthRequest, @Body() body: ForgotPasswordMFAValidation) {
    return this.authService.validateOTPwithGLID(body.glid, 'forgot-password', body.otp, req.sessionId, body.guid);
  }

  /**
   *
   * @param {AuthRequest} req
   * @param {ResetPassword} body
   * @returns
   */
  @Restricted()
  @Post('reset-password')
  async resetPassword(@Req() req: AuthRequest, @Body() body: ResetPassword) {
    return await this.authService.resetPassword(req.user.id, body.password);
  }

  /**
   *
   * @param req
   * @param body
   * @returns
   */
  @Restricted()
  @ApiBearerAuth('accessToken')
  @Post('change-password')
  async changePassword(@Req() req: AuthRequest, @Body() body: changePassword) {
    return await this.authService.changePassword(req.user.id, body.oldPassword, body.newPassword);
  }

  /**
   *
   * @param req
   * @returns
   */
  @Restricted()
  @Post('delete-password')
  async deletePassword(@Req() req: AuthRequest) {
    return this.authService.deletePassword(req.user.id);
  }

  /**
   *
   * @param body
   * @returns
   */
  @Public()
  @Post('forgot-glid')
  async forgotGlid(@Req() req: AuthRequest, @Body() body: ForgotGLID) {
    return await this.authService.recoveryGLID(body.type, body.value, req.sessionId);
  }

  @Restricted()
  @ApiBearerAuth('accessToken')
  @Get('get-session/:id')
  async getSession(@Req() req: AuthRequest, @Param('id') sessionId: string) {
    return await this.authService.getSessionDetail(sessionId, req.user.id);
  }

  @Public()
  @Get('get-my-session')
  async getMySession(@Req() req: AuthRequest) {
    return await this.authService.getSessionDetail(req.sessionId, req.user.id);
  }

  @Restricted()
  @Get('expired-mfas/:sessionId')
  async getExpiredMFAs(@Param('sessionId') sessionId: string) {
    return await this.authService.getExpiredMFAs(sessionId);
  }

  @Restricted()
  @Get('is-password-compromised')
  async IsPasswordCompromised(@Query('password') password: string) {
    return await this.authService.isPasswordCompromised(password);
  }
}
