import {ApiProperty} from '@nestjs/swagger';

export class TokenPayload {
  @ApiProperty({
    required: true,
  })
  refreshToken: string;

  @ApiProperty({
    required: true,
  })
  sessionId: string;
}
