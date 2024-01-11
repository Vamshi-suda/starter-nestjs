import {FastifyRequest, FastifyReply} from 'fastify';
import {Injectable, NestMiddleware} from '@nestjs/common';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: FastifyRequest['raw'], res: FastifyReply['raw'], next: () => void) {
    console.log('Logger Middleware Request...');
    next();
  }
}
