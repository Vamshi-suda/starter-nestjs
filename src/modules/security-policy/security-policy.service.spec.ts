import {Test, TestingModule} from '@nestjs/testing';
import {SecurityPolicyService} from './security-policy.service';

describe('SecurityPolicyService', () => {
  let service: SecurityPolicyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SecurityPolicyService],
    }).compile();

    service = module.get<SecurityPolicyService>(SecurityPolicyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
