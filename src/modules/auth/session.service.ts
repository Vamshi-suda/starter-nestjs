import {BadRequestException, Injectable} from '@nestjs/common';
import {InjectModel} from '@nestjs/mongoose';
import {Model, ObjectId} from 'mongoose';
import {AuthJwtService} from './jwt.service';
import {UserService} from '../user/user.service';
import {ConfigService} from '@nestjs/config';
import {AuthenticationState, IPreAuthentication, ISession, SessionState} from './models/session.model';
import {AuthStatus, IAuthentication} from './models/authentication.schema';
import {IUser} from '../user/models/IUser';
import {LoginAttempt, PreAuthDetails} from './enums/Session';

@Injectable()
export class SessionService {
  private readonly expiration: number;
  constructor(
    @InjectModel('session') private sessionModel: Model<ISession>,
    @InjectModel('authentication') private authenticationModel: Model<IAuthentication>,
    private readonly userSer: UserService,
    private readonly jwtSer: AuthJwtService,
    private readonly configService: ConfigService,
  ) {
    this.expiration = parseInt(this.configService.get('SESSION_EXPIRATION_TIME'));
  }

  getById(id: string) {
    return this.sessionModel.findById(id);
  }

  getByGuid(guid: string) {
    return this.sessionModel.findOne({
      guid,
    });
  }

  async closeAllSessions(sessionId: string, userId: string, status: AuthStatus) {
    const filter = {
      guid: {
        $ne: sessionId,
      },
      userId: userId,
      authenticationState: AuthenticationState.Identified,
      sessionState: SessionState.Active,
    };
    const sessions = await this.sessionModel.find(filter).exec();
    const _updatedSessions = await this.sessionModel
      .updateMany(
        filter,
        {
          sessionState: SessionState.Inactive,
          sessionEnd: new Date(),
        },
        {
          new: true,
        },
      )
      .exec();
    const _updatedAuths = await sessions.map((session) =>
      this.authenticationModel
        .updateOne(
          {
            session_id: session.guid,
          },
          {
            $set: {
              status,
            },
          },
        )
        .exec(),
    );
    return {
      message: 'success',
    };
  }

  // getAuthById(id: string) {
  //   return this.authenticationModel.findById(id).exec();
  // }

  getAuthByGuid(guid: string) {
    return this.authenticationModel.findOne({guid}).exec();
  }
  getAuthBySessionId(session_id: string | ObjectId) {
    return this.authenticationModel
      .findOne({
        session_id,
      })
      .exec();
  }

  getByAccessToken(accessToken: string) {
    return this.authenticationModel
      .findOne({
        accessToken,
      })
      .exec();
  }

  createUnidentifiedSession(ip: string, location: string, device: string) {
    return this.sessionModel.create({
      authenticationState: AuthenticationState.Unidentified,
      IPAddress: ip,
      location,
      device,
      lastAccessTime: Math.ceil(Date.now() / 1000),
      // sessionState: SessionState.Active,
    });
  }

  createPendingSession(userId: string | ObjectId, glid: string) {
    return this.sessionModel.create({
      userId,
      glid,
      authenticationState: AuthenticationState.Pending,
    });
  }

  identifySession(id: ObjectId, userId: string, userName: string) {
    return this.sessionModel
      .updateOne(
        {
          _id: id,
        },
        {
          $set: {
            authenticationState: AuthenticationState.Identified,
            userId,
            userName,
          },
        },
      )
      .exec();
  }

  pushPreAuth(sessionId: string, preAuth: IPreAuthentication) {
    return this.sessionModel
      .updateOne(
        {
          guid: sessionId,
        },
        {
          $push: {
            preAuthentications: preAuth,
          },
        },
      )
      .exec();
  }

  activateSession(id: string | ObjectId) {
    const preAuth = {
      time: new Date(),
      details: PreAuthDetails.SUCCESS,
      attempt: LoginAttempt.SUCCESS,
    };
    return this.sessionModel
      .updateOne(
        {
          _id: id,
        },
        {
          $set: {
            sessionState: SessionState.Active,
            lastAccessTime: Math.floor(Date.now() / 1000),
          },
          $push: {
            preAuthentications: preAuth,
          },
        },
      )
      .exec();
  }

  inActivateSession(id: string) {
    return this.sessionModel
      .updateOne(
        {
          guid: id,
        },
        {
          $set: {
            sessionState: SessionState.Inactive,
            sessionEnd: new Date(),
          },
        },
      )
      .exec();
  }

  createOrUpdateInActiveAuthentication(session_id: string) {
    return this.authenticationModel.findOneAndUpdate(
      {
        session_id,
      },
      {
        session_id,
        // lastAccessTime: Math.ceil(Date.now() / 1000),
        // isActive: false,
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
      },
    );
  }

  async activateAuthentication(guid: string, user: IUser) {
    return this.authenticationModel
      .updateOne(
        {
          guid,
        },
        {
          $set: {
            status: AuthStatus.ACTIVATED,
            accessToken: (await this.jwtSer.createToken(user)).token,
            refreshToken: (await this.jwtSer.createToken(user, true)).token,
          },
        },
      )
      .exec();
  }

  async inActivateAuthentication(guid: string | ObjectId, status: AuthStatus) {
    return this.authenticationModel
      .updateOne(
        {
          guid,
        },
        {
          $set: {
            status,
          },
        },
      )
      .exec();
  }

  async createNewToken(sessionId, refreshToken: string) {
    const session = await this.getByGuid(sessionId);
    if (!session || session.sessionState !== SessionState.Active) {
      throw new BadRequestException('Invalid session');
    }
    const auth = await this.authenticationModel
      .findOne({
        session_id: session._id,
        refreshToken,
      })
      .exec();
    if (!auth || session.lastAccessTime + this.expiration < Math.floor(Date.now() / 1000)) {
      throw new BadRequestException('Session timeout');
    }
    const masterUser = await this.userSer.getMasterUserByGuid(session.userId);
    if (!masterUser) {
      throw new BadRequestException('Invalid GLID');
    }
    const user = await this.userSer.getByGUID(session.userId, masterUser.location);

    const tokenSet = {
      accessToken: (await this.jwtSer.createToken(user)).token,
      refreshToken: (await this.jwtSer.createToken(user, true)).token,
    };

    await this.authenticationModel
      .updateOne(
        {
          session_id: session._id,
          refreshToken,
        },
        {
          $set: {
            // isActive: true,
            // lastAccessTime: Math.ceil(Date.now() / 1000),
            ...tokenSet,
          },
        },
      )
      .exec();
    return tokenSet;
  }

  isTimeOut(session: ISession) {
    return session.lastAccessTime + this.expiration < Math.floor(Date.now() / 1000);
  }

  createSession(session: ISession) {
    return this.sessionModel.create(session);
  }
  async updateLastAccessTime(guid) {
    return this.sessionModel.updateOne(
      {
        guid,
      },
      {
        $set: {
          lastAccessTime: Math.ceil(Date.now() / 1000),
        },
      },
    );
  }

  getSeconds() {
    return Math.floor(new Date().getTime() / 1000);
  }

  async addAuthenticationRecordToSession(sessionId: string, user: IUser) {
    const jwtToken = (await this.jwtSer.createToken(user)).token;
    const refreshToken = (await this.jwtSer.createToken(user, true)).token;

    this.authenticationModel.create({
      session_id: sessionId,
      accessToken: jwtToken,
      refreshToken,
      status: AuthStatus.ACTIVATED,
    });

    return {jwtToken, refreshToken};
  }
}
