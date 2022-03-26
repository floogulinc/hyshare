import { Test, TestingModule } from '@nestjs/testing';
import { HydrusApiService } from './hydrus-api.service';

describe('HydrusApiService', () => {
  let service: HydrusApiService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HydrusApiService],
    }).compile();

    service = module.get<HydrusApiService>(HydrusApiService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
