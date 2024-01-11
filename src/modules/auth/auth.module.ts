import {Global, Logger, Module} from '@nestjs/common';
import {JwtModule} from '@nestjs/jwt';
import {PassportModule} from '@nestjs/passport';
import {ConfigModule, ConfigService} from '@nestjs/config';
import {UserModule} from '../user/user.module';
import {AuthService} from './auth.service';
import {JwtStrategy} from './jwt.strategy';
import {AuthController} from './auth.controller';
import {SessionService} from './session.service';
import {MongooseModule} from '@nestjs/mongoose';
import {AuthJwtService} from './jwt.service';
import {Session} from './models/session.model';
import {MFAAuth} from './models/mfaAuth.schema';
import {EmailService} from 'src/services/email/email.service';
import {AuthenticationSchema} from './models/authentication.schema';
import {CountriesModule} from '../countries/countries.module';
@Global()
@Module({
  imports: [
    MongooseModule.forFeature([{name: 'session', schema: Session}]),
    UserModule,
    ConfigModule,
    MongooseModule.forFeature([{name: 'MFAAuth', schema: MFAAuth}]),
    MongooseModule.forFeature([{name: 'authentication', schema: AuthenticationSchema}]),
    PassportModule.register({defaultStrategy: 'jwt'}),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        return {
          secret: configService.get('WEBTOKEN_SECRET_KEY'),
          signOptions: {
            ...(configService.get('WEBTOKEN_EXPIRATION_TIME')
              ? {
                  expiresIn: Number(configService.get('WEBTOKEN_EXPIRATION_TIME')),
                }
              : {}),
          },
        };
      },
      inject: [ConfigService],
    }),
    CountriesModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, Logger, SessionService, EmailService, AuthJwtService],
  exports: [PassportModule.register({defaultStrategy: 'jwt'}), AuthService, SessionService, AuthJwtService],
})
export class AuthModule {}
