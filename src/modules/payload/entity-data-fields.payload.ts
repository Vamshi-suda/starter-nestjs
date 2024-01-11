import {Optional} from '@nestjs/common';
import {ApiProperty} from '@nestjs/swagger';
import {IsAlphanumeric, IsNotEmpty, MinLength} from 'class-validator';
import {SortOrder} from 'mongoose';

/**
 * Entity Data Paylaod Class
 */
export class EntityDataFieldsPayload {
  /**
   *  entityName
   */
  @ApiProperty({
    required: true,
  })
  @IsAlphanumeric()
  @IsNotEmpty()
  entityName: string;

  @ApiProperty()
  fields: string[];

  @ApiProperty({
    required: true,
    default: {},
  })
  @IsNotEmpty()
  filterQuery: {[key: string]: [value: string]};
}
export class PaginatedEntityDataFieldsPayload extends EntityDataFieldsPayload {
  @ApiProperty({
    required: true,
  })
  sort: {[key: string]: SortOrder};

  @ApiProperty({
    required: true,
    default: 1,
  })
  @IsNotEmpty()
  page: number;

  @ApiProperty({
    required: true,
    default: 10,
  })
  @IsNotEmpty()
  limit: number;
}
