import {FastifyRequest} from 'fastify';

export type PrelaunchRequest = FastifyRequest & {
  prelaunchPwd: string;
};
