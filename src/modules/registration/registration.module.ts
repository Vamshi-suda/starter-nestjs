import {Module} from '@nestjs/common';
import {RegistrationService} from './registration.service';
import {RegistrationController} from './registration.controller';
import {MongooseModule} from '@nestjs/mongoose';
import {Glid} from '../glid/models/glid.schema';
import {Country} from '../countries/models/countries.schema';
import {GlidModule} from '../glid/glid.module';
import {UserModule} from '../user/user.module';
import {AuthModule} from '../auth/auth.module';
import {AttemptedRegistrations} from './models/registration.schema';
import {EmailService} from '@/services/email/email.service';
import {UserMaster} from '../user/models/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {name: 'Glid', schema: Glid},
      {name: 'Country', schema: Country},
      {name: 'AttemptedRegistrations', schema: AttemptedRegistrations},
      {name: 'UserMaster', schema: UserMaster},
    ]),
    GlidModule,
    UserModule,
    AuthModule,
  ],
  controllers: [RegistrationController],
  providers: [RegistrationService, EmailService],
})
export class RegistrationModule {}
