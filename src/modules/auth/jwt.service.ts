import {Injectable} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import {JwtService} from '@nestjs/jwt';
import {ITokenReturnBody} from './auth.service';
import {IUser} from '../user/models/IUser';

@Injectable()
export class AuthJwtService {
  /**
   * Time in seconds when the token is to expire
   * @type {string}
   */
  private readonly expiration: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {
    this.expiration = this.configService.get('WEBTOKEN_EXPIRATION_TIME');
  }

  /**
   * Creates a signed jwt token based on IUser payload
   * @param {User} param dto to generate token from
   * @returns {Promise<ITokenReturnBody>} token body
   */
  async createToken({guid, name}: IUser, isRefreshToken?: boolean): Promise<ITokenReturnBody> {
    return {
      expires: this.expiration,
      expiresPrettyPrint: AuthJwtService.prettyPrintSeconds(this.expiration),
      token: this.jwtService.sign({id: guid, name}, isRefreshToken ? {expiresIn: '20 days'} : undefined),
    };
  }

  validateToken(token: string) {
    return this.jwtService.verify(token);
  }

  /**
   * Formats the time in seconds into human-readable format
   * @param {string} time
   * @returns {string} hrf time
   */
  private static prettyPrintSeconds(time: string): string {
    const ntime = Number(time);
    const hours = Math.floor(ntime / 3600);
    const minutes = Math.floor((ntime % 3600) / 60);
    const seconds = Math.floor((ntime % 3600) % 60);

    return `${hours > 0 ? hours + (hours === 1 ? ' hour,' : ' hours,') : ''} ${
      minutes > 0 ? minutes + (minutes === 1 ? ' minute' : ' minutes') : ''
    } ${seconds > 0 ? seconds + (seconds === 1 ? ' second' : ' seconds') : ''}`;
  }
}
