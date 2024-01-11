import {Inject, Injectable, InternalServerErrorException, Logger, NotFoundException} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import {InjectConnection} from '@nestjs/mongoose';
import {Connection, SchemaType} from 'mongoose';
import {ERROR_ENTITY_NOT_FOUND_IN_DB} from '../utils/constants';
import {EntityDataFieldsPayload, PaginatedEntityDataFieldsPayload} from './payload/entity-data-fields.payload';

@Injectable()
export class AppService {
  /**
   * Constructor
   * @param {ConfigService} config configuration service
   * @param {Logger} logger logger service
   */
  constructor(
    private config: ConfigService,
    @InjectConnection() private readonly dbConnection: Connection,
  ) {}

  getHello(): string {
    return 'Hello World!';
  }

  getEntities(): string[] {
    return this.dbConnection.modelNames();
  }

  getEntityDetails(entity: string): Record<string, any> {
    const entries = [];
    if (this.dbConnection.model(entity).exists) {
      this.dbConnection.model(entity).schema.eachPath((path: string, type: SchemaType) => {
        if (!(path === '__v' || type.instance === 'ObjectID')) {
          entries.push({
            name: path,
            type: type.instance,
          });
        }
      });
      return entries;
    } else {
      throw new NotFoundException(ERROR_ENTITY_NOT_FOUND_IN_DB);
    }
  }

  async getEntityData(payload: EntityDataFieldsPayload) {
    if (this.dbConnection.modelNames().includes(payload.entityName)) {
      try {
        const data = await this.dbConnection
          .model(payload.entityName)
          .find(payload.filterQuery ?? {}, `${payload.fields.length > 0 ? payload.fields.join(' ') : ''} -_id`)
          .exec();
        return data;
      } catch (error) {
        throw new InternalServerErrorException(error);
      }
    } else {
      throw new NotFoundException(ERROR_ENTITY_NOT_FOUND_IN_DB);
    }
  }

  async getPaginatedEntityData(payload: PaginatedEntityDataFieldsPayload) {
    if (this.dbConnection.modelNames().includes(payload.entityName)) {
      try {
        const data = {
          total: 0,
          page: payload.page,
          pageSize: payload.limit,
          items: [],
        };
        const query = this.dbConnection
          .model(payload.entityName)
          .find(payload.filterQuery, `${payload.fields.length > 0 ? payload.fields.join(' ') : ''} -_id`);
        data.total = await this.dbConnection.model(payload.entityName).countDocuments(query);
        data.items = await this.dbConnection
          .model(payload.entityName)
          .find(query)
          .sort(payload.sort)
          .skip((payload.page - 1) * payload.limit)
          .limit(payload.limit)
          .exec();

        return data;
      } catch (error) {
        throw new InternalServerErrorException(error);
      }
    } else {
      throw new NotFoundException(ERROR_ENTITY_NOT_FOUND_IN_DB);
    }
  }
}
