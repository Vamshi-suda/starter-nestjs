import {FastifyRequest} from 'fastify';

export type AuthRequest = FastifyRequest & {
  user: {id: string};
  sessionId?: string;
};
