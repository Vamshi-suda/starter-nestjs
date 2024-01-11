import {Module} from '@nestjs/common';
import {MongooseModule} from '@nestjs/mongoose';
import {PlatformUsers} from './platform-testing.model';
import {PlatformTestingService} from './platform-testing.service';
import {PlatformTestingController} from './platform-testing.controller';

@Module({
  imports: [MongooseModule.forFeature([{name: 'PlatformUsers', schema: PlatformUsers}])],
  providers: [PlatformTestingService],
  controllers: [PlatformTestingController],
  exports: [PlatformTestingService],
})
export class PlatformTestingModule {}
