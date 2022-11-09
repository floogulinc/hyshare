import { Test, TestingModule } from '@nestjs/testing';
import { ComicService } from './comic.service';

describe('ComicService', () => {
  let service: ComicService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ComicService],
    }).compile();

    service = module.get<ComicService>(ComicService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
