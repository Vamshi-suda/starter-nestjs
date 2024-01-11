import {HttpAdapterHost, NestFactory} from '@nestjs/core';
import {FastifyAdapter, NestFastifyApplication} from '@nestjs/platform-fastify';
import {DocumentBuilder, SwaggerModule, SwaggerCustomOptions} from '@nestjs/swagger';
import helmet from '@fastify/helmet';
import fastifyRateLimiter from '@fastify/rate-limit';
import {v4 as uuidv4} from 'uuid';
import {AppModule} from './modules/app.module';
import {join} from 'path';
import {ValidationPipe} from '@nestjs/common';
import {GlobalExceptionFilter} from './common/filters/exception.filter';
import fastifyCookie from '@fastify/cookie';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      logger: true,
      requestIdHeader: false,
      genReqId: (req) => uuidv4(),
    }),
  );
  app.enableCors({
    credentials: true,
    origin: true,
    exposedHeaders: ['set-cookie'],
  });
  app.useStaticAssets({
    root: join(__dirname, '..', 'public'),
    prefix: '/public',
    decorateReply: false,
  });
  app.useStaticAssets({
    root: join(__dirname, '..', 'typedocs'),
    prefix: '/typedocs/',
    decorateReply: false,
  });
  app.useGlobalFilters(new GlobalExceptionFilter());

  if (process.env.NODE_ENV !== 'production') {
    const options = new DocumentBuilder()
      .setTitle(`${process.env.ORGANIZATION_NAME || ''} ${process.env.SWAGGER_API_NAME}`)
      .addServer(process.env.SWAGGER_API_SERVER, process.env.NODE_ENV)
      .setDescription(`${process.env.ORGANIZATION_NAME || ''} ${process.env.SWAGGER_API_DESCRIPTION}`)
      .setVersion(process.env.SWAGGER_API_CURRENT_VERSION)
      .setContact(process.env.ORGANIZATION_NAME, process.env.ORGANIZATION_URL, process.env.ORGANIZATION_CONTACT)
      .setLicense(`© ${new Date().getFullYear()} ${process.env.ORGANIZATION_NAME || ''}`, process.env.ORGANIZATION_URL)
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'JWT',
          description: 'Enter JWT token',
          in: 'header',
        },
        'accessToken',
      )
      .build();
    const document = SwaggerModule.createDocument(app, options);
    const customSwaggerOptions: SwaggerCustomOptions = {
      customCssUrl: `${process.env.SWAGGER_API_SERVER}/public/swagger-ui.css`,
      customJsStr: `document.addEventListener('DOMContentLoaded', function() {
        window.siteurl = '${process.env.SWAGGER_API_SERVER}';
        window.homeurl = '${process.env.SSO_ENDPOINT_URL}';
      })`,
      customJs: `${process.env.SWAGGER_API_SERVER}/public/swagger-ui.js`,
      customSiteTitle: 'AgileOne - Management APIs',
      customfavIcon: `${process.env.SWAGGER_API_SERVER}/public/favicon.png`,
      swaggerOptions: {
        persistAuthorization: true,
      },
    };
    SwaggerModule.setup(process.env.SWAGGER_API_ROOT, app, document, customSwaggerOptions);
  }

  app.useGlobalPipes(new ValidationPipe());

  app.register(helmet as any, {
    crossOriginEmbedderPolicy: {policy: 'credentialless'},
    contentSecurityPolicy: {
      directives: {
        defaultSrc: [`'self'`],
        styleSrc: [`'self'`, `'unsafe-inline'`],
        imgSrc: [`'self'`, 'https: data:', 'data:', 'validator.swagger.io'],
        scriptSrc: [`'self'`, `https: 'unsafe-inline'`],
      },
    },
  });

  app.register(fastifyRateLimiter as any, {
    max: parseInt(process.env.APP_RATELIMIT_REQUESTS, 10), // limit each IP to #no requests per windowMs
    timeWindow: process.env.APP_RATELIMIT_TIMESPAN, // #no minutes in ms
  });

  app.register(fastifyCookie as any, {
    secret: process.env.COOKIE_SECRET, // for cookies signature
  });

  await app.listen(process.env.APP_PORT);
}
bootstrap();
