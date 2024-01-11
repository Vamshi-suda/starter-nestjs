import {ApiProperty} from '@nestjs/swagger';
import {IsNotEmpty} from 'class-validator';

export class UpdateSession {
  @ApiProperty({
    required: true,
  })
  id: string;
}

class Browser {
  @ApiProperty({
    required: true,
  })
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    required: true,
  })
  @IsNotEmpty()
  version: string;
}

class OS {
  @ApiProperty({
    required: true,
  })
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    required: true,
  })
  @IsNotEmpty()
  version: string;
}

export class CreateSession {
  @ApiProperty({
    required: true,
  })
  browser: Browser;

  @ApiProperty({
    required: true,
  })
  OS: OS;
}

export class CloseSession {
  @ApiProperty({
    required: true,
  })
  sessionId: string;
}
