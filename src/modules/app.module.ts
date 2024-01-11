import {Logger, Module} from '@nestjs/common';
import {MongooseModule, MongooseModuleOptions} from '@nestjs/mongoose';
import {ConfigModule, ConfigService} from '@nestjs/config';
import {APP_INTERCEPTOR, APP_GUARD} from '@nestjs/core';

import {AppController} from './app.controller';
import {AppService} from './app.service';
import {AuthGuard} from '../common/guards/auth.guard';
import {CorsInterceptor} from '../common/interceptors/cors.interceptor';
import {TransformInterceptor} from '../common/interceptors/transform.interceptor';
import {validate} from '../common/config/env.validation';
import {RolesGuard} from '../common/guards/roles.guard';
import {UserModule} from './user/user.module';
import {AuthModule} from './auth/auth.module';
import {GlidModule} from './glid/glid.module';
import {RegistrationModule} from './registration/registration.module';
import {CountriesModule} from './countries/countries.module';
import {JwtService} from '@nestjs/jwt';
import {JwtStrategy} from './auth/jwt.strategy';
import {LanguagesModule} from './languages/languages.module';
import {TranslationsController} from './translations/translations.controller';
import {TranslationsModule} from './translations/translations.module';
import {SecurityPolicyModule} from './security-policy/security-policy.module';
import {EmailService} from '@/services/email/email.service';
import {SessionModule} from './sessions/session.module';
import {PlatformTestingModule} from './platform-testing/platform-testing.module';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        ({
          uri: configService.get('DB_URL'),
          useNewUrlParser: true,
          useUnifiedTopology: true,
        }) as MongooseModuleOptions,
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env.production', '.env.staging', '.env.uat', '.env.development', '.env'],
      validate,
      validationOptions: {
        allowUnknown: true,
        abortEarly: true,
      },
      expandVariables: true,
    }),
    UserModule,
    AuthModule,
    GlidModule,
    RegistrationModule,
    CountriesModule,
    LanguagesModule,
    TranslationsModule,
    SecurityPolicyModule,
    SessionModule,
    PlatformTestingModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    EmailService,
    JwtService,
    JwtStrategy,
    Logger,
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: CorsInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
