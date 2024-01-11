import {Module} from '@nestjs/common';

import {MongooseModule} from '@nestjs/mongoose';
import {GlidController} from './glid.controller';
import GlidService from './glid.service';
import {Glid} from './models/glid.schema';
import {UserModule} from '../user/user.module';
import {AuthModule} from '../auth/auth.module';

@Module({
  imports: [MongooseModule.forFeature([{name: 'Glid', schema: Glid}]), UserModule, AuthModule],
  providers: [GlidService],
  exports: [GlidService],
  controllers: [GlidController],
})
export class GlidModule {}
