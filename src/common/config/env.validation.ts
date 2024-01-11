import {plainToInstance} from 'class-transformer';
import {IsEnum, IsNumber, Matches, validateSync} from 'class-validator';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
  Provision = 'provision',
}

export class EnvironmentVariables {
  @IsEnum(Environment)
  APP_ENV: Environment;

  @IsNumber()
  APP_PORT: number;

  APP_URL: string;

  @Matches(/mongodb?/)
  DB_URL: string;

  WEBTOKEN_SECRET_KEY: string;
  WEBTOKEN_EXPIRATION_TIME: string;
  SESSION_EXPIRATION_TIME: string;
  FASTER_BASE_URL: string;
  SWAGGER_API_ROOT: string;
  SWAGGER_API_SERVER: string;
  SWAGGER_API_NAME: string;
  SWAGGER_API_DESCRIPTION: string;
  SWAGGER_API_CURRENT_VERSION: string;
  APP_RATELIMIT_REQUESTS: string;
  APP_RATELIMIT_TIMESPAN: string;
  ORGANIZATION_URL: string;
  ORGANIZATION_CONTACT: string;
  ORGANIZATION_DESCRIPTION: string;
  ORGANIZATION_NAME: string;
  SENDGRID_API_KEY: string;
  SENDGRID_EMAIL_SENDER_NAME: string;
  SENDGRID_EMAIL_SENDER: string;
  SENDGRID_EMAIL_TEMPLATE_OTP_MAGICLINK: string;
  COOKIE_SECRET: string;
  COOKIE_DOMAIN: string;
  MAGICLINK_URL: string;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }
  return validatedConfig;
}
