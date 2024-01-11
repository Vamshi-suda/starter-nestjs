import {Module} from '@nestjs/common';
import {UserService} from './user.service';
import {MongooseModule} from '@nestjs/mongoose';
import {User, UserMaster} from './models/user.schema';
import {UserController} from './user.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      {name: 'User', schema: User},
      {name: 'UserMaster', schema: UserMaster},
    ]),
  ],
  providers: [UserService],
  exports: [UserService],
  controllers: [UserController],
})
export class UserModule {}
