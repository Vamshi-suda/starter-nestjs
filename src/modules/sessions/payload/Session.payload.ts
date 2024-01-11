import {AuthenticationState, SessionState} from '@/modules/auth/models/session.model';
import {UUIDVersion} from '@/utils/uuid';
import {ApiProperty} from '@nestjs/swagger';
import {IsAlphanumeric, IsUUID} from 'class-validator';

class SessionQuery {
  @ApiProperty({
    required: true,
  })
  sessionState?: SessionState;
  @ApiProperty({
    required: true,
    isArray: true,
    default: [],
  })
  authenticationStates?: AuthenticationState[];
}

export class GetSessions {
  @ApiProperty({
    required: true,
  })
  query: SessionQuery;

  @ApiProperty({
    required: false,
    default: 1,
  })
  page: number;

  @ApiProperty({
    required: false,
    default: 10,
  })
  pageSize: number;

  @ApiProperty({
    required: false,
  })
  search: string;
}

export class CloseSession {
  @ApiProperty({
    required: true,
  })
  @IsUUID(UUIDVersion)
  sessionId: string;
}
