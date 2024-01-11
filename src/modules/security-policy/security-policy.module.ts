import {Module} from '@nestjs/common';
import {SecurityPolicyService} from './security-policy.service';
import {MongooseModule} from '@nestjs/mongoose';
import {SecurityPolicyController} from './security-policy.controller';
import {SecurityPolicy} from './models/security-policy.schema';

@Module({
  imports: [MongooseModule.forFeature([{name: 'SecurityPolicy', schema: SecurityPolicy}])],
  controllers: [SecurityPolicyController],
  providers: [SecurityPolicyService],
  exports: [SecurityPolicyService],
})
export class SecurityPolicyModule {}
