import {applyDecorators} from '@nestjs/common';
import {ApiHeader} from '@nestjs/swagger';

export function secretHeaders() {
  return applyDecorators(
    ApiHeader({
      name: 'client-id',
      description: 'client-id',
      required: true,
    }),
    ApiHeader({
      name: 'e-api-secret-token',
      description: 'e-api-secret-token',
      required: true,
    }),
  );
}
