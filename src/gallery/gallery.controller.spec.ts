import { Test, TestingModule } from '@nestjs/testing';
import { GalleryController } from './gallery.controller';

describe('GalleryController', () => {
  let controller: GalleryController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GalleryController],
    }).compile();

    controller = module.get<GalleryController>(GalleryController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
