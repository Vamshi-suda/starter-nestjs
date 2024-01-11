import {Injectable, BadRequestException} from '@nestjs/common';
import {InjectModel} from '@nestjs/mongoose';
import {Model, FilterQuery, AggregateOptions, Aggregate, AggregationVariables, PipelineStage} from 'mongoose';
import {hashPassword} from 'src/utils/helpers/passwordhelper';
import {IUser, UserMaster} from './models/IUser';
import {updatePasswordPayload} from './user.controller';

/**
 * Models a typical response for a crud operation
 */
export interface IGenericMessageBody {
  /**
   * Status message to return
   */
  message: string;
}

/**
 * User Service
 */
@Injectable()
export class UserService {
  /**
   * Constructor
   * @param {Model<IUser>} userModel
   */
  constructor(
    @InjectModel('User') private readonly userModel: Model<IUser>,
    @InjectModel('UserMaster') private readonly userMasterModel: Model<UserMaster>,
  ) {}
  /**
   * Fetches a user from database by UUID
   * @param {string} id
   * @returns {Promise<IUser>} queried user data
   */
  // get(id: string): Promise<IUser> {
  //   return this.userModel.findById(id).exec();
  // }

  /**
   * Fetches a user from database by guid
   * @param {string} guid
   * @returns {Promise<IUser>} queried user data
   */
  getByGUID(guid: string, location: string): Promise<IUser> {
    return this.userModel
      .findOne({
        guid,
        location,
      })
      .exec();
  }

  /**
   * Create a user with RegisterPayload fields
   * @param {RegisterPayload} payload user payload
   * @returns {Promise<IUser>} created user data
   */
  async create(user: IUser): Promise<IUser> {
    const createdUser = new this.userModel(user);

    return createdUser.save();
  }

  /**
   * Delete user given a username
   * @param {string} username
   * @returns {Promise<IGenericMessageBody>} whether or not the crud operation was completed
   */
  delete(username: string): Promise<IGenericMessageBody> {
    return this.userModel.deleteOne({username}).then((user) => {
      if (user.deletedCount === 1) {
        return {message: `Deleted ${username} from records`};
      } else {
        throw new BadRequestException(`Failed to delete a user by the name of ${username}.`);
      }
    });
  }

  findByGlid(id: string, location: string) {
    return this.userModel.findOne({glid: id, location}).exec();
  }
  async getUserByQuery(
    filterQuery: {
      [id: string]: any;
      location: string;
    },
    projectionFields?,
  ) {
    const userDetails = await this.userModel.findOne(filterQuery, projectionFields);
    return userDetails;
  }

  async getUserMasterByQuery(filterQuery: FilterQuery<UserMaster> = {}, projectionFields?) {
    const userDetails = await this.userMasterModel.findOne(filterQuery, projectionFields);
    return userDetails;
  }
  async updateUser(filterQuery: FilterQuery<IUser>, updateDetails, options?) {
    return await this.userModel.findOneAndUpdate(filterQuery, updateDetails, {
      ...options,
      new: true,
    });
  }

  async updateUserMaster(filterQuery: FilterQuery<IUser>, updateDetails, options?) {
    await this.userMasterModel.findOneAndUpdate(filterQuery, updateDetails, {
      ...options,
    });
  }

  async getUserDetails(guid: string) {
    const userDetails = await this.userMasterModel.aggregate([
      {
        $match: {guid},
      },
      {
        $lookup: {
          from: 'users',
          let: {
            guid: '$guid',
            location: '$location',
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [{$eq: ['$guid', '$$guid']}, {$eq: ['$location', '$$location']}],
                },
              },
            },
          ],
          as: 'result',
        },
      },

      {$unwind: '$result'},
    ]);

    return userDetails[0].result;
  }

  async updateUserPassword(guid: string, password: string) {
    const newPassword = password ? await hashPassword(password) : null;
    return await this.updateUserMaster(
      {guid},
      {
        $set: {
          password: newPassword,
        },
      },
    );
  }

  async aggregateUser(pipeline: PipelineStage[], options?: AggregateOptions) {
    return this.userMasterModel.aggregate(pipeline, options);
  }
  async createMasterUser(userDetails: UserMaster) {
    const user = new this.userMasterModel(userDetails);
    return user.save();
  }

  async findMasterOne(filter: FilterQuery<UserMaster>) {
    return this.userMasterModel.findOne(filter);
  }

  getMasterUserByGuid(guid: string) {
    return this.userMasterModel.findOne({guid: guid}).exec();
  }

  getMasterUserByGLID(glid: string) {
    return this.userMasterModel
      .findOne({
        glid: glid,
      })
      .exec();
  }
}
