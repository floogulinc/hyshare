import { Test, TestingModule } from '@nestjs/testing';
import { ComicController } from './comic.controller';

describe('ComicController', () => {
  let controller: ComicController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ComicController],
    }).compile();

    controller = module.get<ComicController>(ComicController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
