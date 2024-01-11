import {Module} from '@nestjs/common';
import {SessionService} from './session.service';
import {SessionController} from './session.controller';
import {Session} from '../auth/models/session.model';
import {MongooseModule} from '@nestjs/mongoose';
import {AuthenticationSchema} from '../auth/models/authentication.schema';
import {User} from '../user/models/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{name: 'session', schema: Session}]),
    MongooseModule.forFeature([{name: 'authentication', schema: AuthenticationSchema}]),
    MongooseModule.forFeature([{name: 'user', schema: User}]),
  ],
  providers: [SessionService],
  controllers: [SessionController],
})
export class SessionModule {}
