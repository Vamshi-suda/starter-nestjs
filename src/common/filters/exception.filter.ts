import {FastifyRequest, FastifyReply} from 'fastify';
import {ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus} from '@nestjs/common';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  async catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<FastifyRequest>();
    const response = ctx.getResponse<FastifyReply>();
    let status: HttpStatus;

    let error: string;
    let errorMessage: string | object;
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const errorResponse = exception.getResponse();
      error = (errorResponse as HttpExceptionResponse).error ?? exception.message;
      errorMessage = (errorResponse as HttpExceptionResponse).message;
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      error = 'Internal Server Error Occured';
      errorMessage = exception.message || '';
    }
    const errorResponse = this.getErrorResponse(status, error, request, errorMessage);
    this.logError(exception);

    if (response?.send) {
      response.status(status).send({data: errorResponse, succeeded: false});
    }
  }
  private getErrorResponse = (
    status: HttpStatus,
    error: string,
    request: FastifyRequest,
    errorMessage: string | object,
  ): CustomHttpExceptionResponse => ({
    statusCode: status,
    error: error,
    path: request.url,
    method: request.method,
    timeStamp: new Date(),
    message: errorMessage,
  });

  private logError = (exception: unknown) => {
    //just created to log the errors into a file

    console.log(exception);
  };
}

export interface HttpExceptionResponse {
  statusCode: HttpStatus;
  error: string;
  message?: string | object;
}

export interface CustomHttpExceptionResponse extends HttpExceptionResponse {
  path: string;
  method: string;
  timeStamp: Date;
}
