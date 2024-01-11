import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  // HttpException,
  // HttpStatus,
  // UnauthorizedException,
  // InternalServerErrorException,
} from '@nestjs/common';
// import axios from 'axios';
// import {IncomingMessage, ServerResponse} from 'http';
// import {Observable} from 'rxjs';

@Injectable()
export class CorsInterceptor implements NestInterceptor {
  constructor() {}
  async intercept(context: ExecutionContext, next: CallHandler) {
    //const request: IncomingMessage = context.switchToHttp().getRequest();
    //const response: ServerResponse = context.switchToHttp().getResponse();

    // if ('access-control-request-headers' in request.headers) {
    //   response.setHeader('access-control-request-headers', request.headers['access-control-request-headers']);
    // }

    // if ('access-control-request-method' in request.headers) {
    //   response.setHeader('access-control-request-method', request.headers['access-control-request-method']);
    // }

    // if ('Cross-Origin-Embedder-Policy' in request.headers) {
    //   response.setHeader('Cross-Origin-Embedder-Policy', request.headers['Cross-Origin-Embedder-Policy']);
    // }

    // response.setHeader('access-control-allow-origin', '*');

    return next.handle();
  }
}
