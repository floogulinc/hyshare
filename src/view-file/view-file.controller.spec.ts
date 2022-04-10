import { Test, TestingModule } from '@nestjs/testing';
import { ViewFileController } from './view-file.controller';

xdescribe('ViewFileController', () => {
  let controller: ViewFileController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ViewFileController],
    }).compile();

    controller = module.get<ViewFileController>(ViewFileController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
