import {Test, TestingModule} from '@nestjs/testing';
import {GlidController} from './glid.controller';

describe('GlidController', () => {
  let controller: GlidController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GlidController],
    }).compile();

    controller = module.get<GlidController>(GlidController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
