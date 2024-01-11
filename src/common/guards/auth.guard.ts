import {CanActivate, ExecutionContext, Injectable, UnauthorizedException} from '@nestjs/common';
import {Reflector} from '@nestjs/core';
import {IS_PUBLIC_KEY} from '../decorators/public.decorator';
import {IS_RESTRICTED_KEY} from '../decorators/restricted.decorator';
import {SessionService} from 'src/modules/auth/session.service';
import {AuthJwtService} from 'src/modules/auth/jwt.service';
import {FastifyRequest} from 'fastify';
import {ISession, SessionState} from 'src/modules/auth/models/session.model';
import {AuthStatus} from '@/modules/auth/models/authentication.schema';
import {DO_NOT_UPDATE_SESSION_KEY} from '../decorators/do-not-update-session.decorator';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private sessionSer: SessionService,
    private jwtSer: AuthJwtService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: FastifyRequest & {
      user: any;
      sessionId?: string;
    } = context.switchToHttp().getRequest();
    const cookies = request.cookies;
    const sessionId = cookies['session-id'];
    const accessToken = cookies['access-token'];

    let updatedSession = false;
    let timeOut = false;

    const doNotUpdateSession = this.reflector.getAllAndOverride<boolean>(DO_NOT_UPDATE_SESSION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (doNotUpdateSession) {
      request.sessionId = sessionId;
      return true;
    }

    if (sessionId) {
      const session: ISession = await this.sessionSer.getByGuid(sessionId);
      request.sessionId = sessionId;
      if (session) {
        const auth = await this.sessionSer.getAuthBySessionId(session.guid);
        if (auth) {
          if (this.sessionSer.isTimeOut(session) && auth.status === AuthStatus.ACTIVATED) {
            request.sessionId = undefined;
            timeOut = true;
          } else if ([AuthStatus.CREATED, AuthStatus.ACTIVATED].includes(auth.status)) {
            this.sessionSer.updateLastAccessTime(session.guid);
            updatedSession = true;
          }
        }
      }
    }
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [context.getHandler(), context.getClass()]);
    if (isPublic) {
      return true;
    }
    const restrictedAccess = this.reflector.getAllAndOverride<string[]>(IS_RESTRICTED_KEY, [context.getHandler(), context.getClass()]);
    if (restrictedAccess) {
      if (timeOut) {
        throw new UnauthorizedException();
      }
      // TODO implement secret token validation from DB
      const token = this.extractTokenFromHeader(request) || accessToken;
      if (!token) {
        throw new UnauthorizedException();
      }
      try {
        const val = this.jwtSer.validateToken(token);
        if (!updatedSession) {
          const auth = await this.sessionSer.getByAccessToken(token);
          const session = auth ? await this.sessionSer.getByGuid(auth.session_id) : null;

          if ((!auth && !session) || this.sessionSer.isTimeOut(session) || auth.status !== AuthStatus.ACTIVATED) {
            throw new UnauthorizedException();
          }
          this.sessionSer.updateLastAccessTime(auth.session_id);
        }
        request.user = val;
        return true;
      } catch (err) {
        throw new UnauthorizedException();
      }
    }
    return true;
  }

  private extractTokenFromHeader(request: FastifyRequest): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
