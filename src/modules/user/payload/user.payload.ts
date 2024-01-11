import {ApiProperty} from '@nestjs/swagger';

export class LocaleUpdate {
  @ApiProperty({required: true})
  updatedParam: string;
  @ApiProperty({required: true})
  updatedValue: string;
}
