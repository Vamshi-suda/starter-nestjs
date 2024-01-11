import {Test, TestingModule} from '@nestjs/testing';
import {SecurityPolicyController} from './security-policy.controller';

describe('SecurityPolicyController', () => {
  let controller: SecurityPolicyController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SecurityPolicyController],
    }).compile();

    controller = module.get<SecurityPolicyController>(SecurityPolicyController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
