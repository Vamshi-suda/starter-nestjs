import {BadRequestException, Injectable} from '@nestjs/common';
import {InjectModel} from '@nestjs/mongoose';
import {AuthenticationState, ISession, SessionState} from '../auth/models/session.model';
import {Model} from 'mongoose';
import {AuthStatus, IAuthentication} from '../auth/models/authentication.schema';
import {IUser} from '../user/models/IUser';

@Injectable()
export class SessionService {
  constructor(
    @InjectModel('session') private sessionModel: Model<ISession>,
    @InjectModel('authentication') private authenticationModel: Model<IAuthentication>,
    @InjectModel('user') private userModel: Model<IUser>,
  ) {}

  async getSessions(
    sessionId: string,
    userId: string,
    query: {
      sessionState?: SessionState;
      authenticationStates?: AuthenticationState[];
    },
    page: number,
    pageSize: number,
    search?: string,
  ) {
    page = page <= 0 ? 1 : page;
    pageSize = pageSize || 10;
    const time = Math.floor(Date.now() / 1000) - 5 * 60;
    let filter: Record<string, any> = {};
    const user = await this.userModel.findOne({guid: userId});
    let isPlatformUser = false;
    if (user.preference) {
      isPlatformUser = !!user.preference?.platformUser;
    }
    if (!isPlatformUser) {
      filter.userId = userId;
    }
    if (query.sessionState) {
      if (query.sessionState === SessionState.Active) {
        // filter.sessionState = query.sessionState;
        filter = {
          ...filter,
          $or: [
            {
              sessionState: SessionState.Active,
              lastAccessTime: {
                $gt: time,
              },
            },
            {
              sessionState: {
                $exists: false,
              },
            },
          ],
        };
      } else if (query.sessionState === SessionState.Inactive) {
        filter = {
          ...filter,
          $or: [
            {
              sessionState: SessionState.Inactive,
            },
            {
              lastAccessTime: {
                $lt: time,
              },
            },
          ],
        };
      }
    }
    if (query.authenticationStates && query.authenticationStates.length > 0) {
      filter.authenticationState = {
        $in: query.authenticationStates,
      };
    }
    if (search) {
      filter.userName = {
        $regex: `.*${search}.*`,
        $options: 'i',
      };
    }

    const sessions = await this.sessionModel
      .find(filter)
      .sort({
        sessionStart: 'desc',
      })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .populate('userDetails', 'name')
      .populate('authDetails', '-_id guid status')
      .exec();
    const total = await this.sessionModel.count(filter);
    const currentSession = isPlatformUser ? undefined : sessions.find((session) => session.guid === sessionId);
    return {
      sessions: sessions.filter((session) => currentSession !== session),
      total,
      currentSession,
      isPlatformUser,
    };
  }

  getSession(guid: string) {
    return this.sessionModel
      .findOne({
        guid,
      })
      .populate('userDetails', 'name')
      .populate('authDetails', '-_id lastAccessTime guid status')
      .exec();
  }

  async closeSession(guid: string) {
    const session = await this.sessionModel.findOne({
      guid,
    });
    if (!session) {
      throw new BadRequestException('Invalid session');
    }

    await this.authenticationModel
      .findOneAndUpdate(
        {
          session_id: session.id.toString(),
        },
        {
          status: AuthStatus.CLOSE_SESSION,
        },
      )
      .exec();
    return {
      message: 'successfully closed session',
    };
  }
}
