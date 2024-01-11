import {BadRequestException, HttpStatus, Injectable} from '@nestjs/common';
import {InjectModel} from '@nestjs/mongoose';
import {GlidStatus} from './models/glid.schema';
import Glid from './models/glid';
import {UserService} from '../user/user.service';

@Injectable()
class GlidService {
  constructor(
    private _userService: UserService,
    @InjectModel('Glid') private readonly glidModel,
  ) {}

  public async isGlidAvailable(glid: string) {
    const glidDetails = await this.glidModel.findOne({glid});

    return !glidDetails || glidDetails.status === GlidStatus.UNRESERVED;
  }

  public async addorUpdateGlid(glidDetails: Glid) {
    const {glid, status} = glidDetails;
    if (!glid || !status) {
      throw new BadRequestException({
        status: HttpStatus.BAD_REQUEST,
        error: 'Passed details should contain both glid and status',
      });
    }

    let filterQuery = {};

    switch (status) {
      case GlidStatus.PENDING:
        filterQuery = {
          glid,
          status: GlidStatus.UNRESERVED,
        };
        break;
      case GlidStatus.RESERVED:
        filterQuery = {glid, status: GlidStatus.PENDING};
        break;
      case GlidStatus.UNRESERVED:
        filterQuery = {
          $or: [
            {glid, status: GlidStatus.RESERVED},
            {glid, status: GlidStatus.PENDING},
          ],
        };
        break;
    }

    const newGlid = await this.glidModel.findOneAndUpdate(
      filterQuery,
      {
        ...glidDetails,
        lastModifiedDate: new Date(),
      },
      {new: true, upsert: true, runValidators: true},
    );

    return newGlid;
  }

  public async findGlidByQuery(filter = {}, predicate?) {
    const glid = await this.glidModel.findOne(filter, predicate);
    return glid;
  }

  public async updateGlid(filter, updateQuery) {
    const glid = await this.glidModel.findOneAndUpdate(filter, updateQuery, {new: true});
    return glid;
  }

  public async checkIfGlidIsAvailable(glid: string) {
    const user = await this._userService.getUserMasterByQuery({glid});
    if (user) {
      return {status: GlidStatus.RESERVED};
    }
    const mfaDetails = (
      await this.glidModel.aggregate([
        {$match: {glid}},
        {
          $lookup: {
            from: 'mfaauths',
            localField: 'mfaAuthIds',
            foreignField: 'guid',
            as: 'mfa',
          },
        },
      ])
    )[0];

    if (!mfaDetails) {
      return {status: GlidStatus.UNRESERVED, new: true};
    }

    const {_id, glid: glidName} = mfaDetails;

    const mfaSessionDetails = [...mfaDetails.mfa];
    if (mfaSessionDetails.filter((x) => new Date(x.expiryDate) > new Date()).length) {
      return {status: GlidStatus.PENDING};
    }
    return {status: GlidStatus.UNRESERVED, _id, glid: glidName};
  }

  public async addGlidIfNotExists(glid: string) {
    const glidDetails = await this.glidModel.findOneAndUpdate({glid}, {glid}, {new: true, upsert: true, setDefaultsOnInsert: true});
    return glidDetails?.toObject({versionKey: false});
  }
}

export default GlidService;
