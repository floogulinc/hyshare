import {
  CacheInterceptor,
  CacheTTL,
  Controller,
  Get,
  Param,
  Render,
  UseInterceptors,
} from '@nestjs/common';
import { map } from 'rxjs';
import { AppConfig } from 'src/config';
import { HydrusApiService } from 'src/hydrus-api/hydrus-api.service';

@Controller('gallery')
export class GalleryController {
  constructor(
    private readonly hydrusApiService: HydrusApiService,
    private appConfig: AppConfig,
  ) {}

  namespace = 'hyshare';

  getHashes(tag: string) {
    return this.hydrusApiService
      .searchFiles([`${this.namespace}:${tag}`, ...this.appConfig.searchTags], {
        return_hashes: true,
        tag_service_name: this.appConfig.tagServiceToSearch,
      })
      .pipe(map(({ hashes }) => ({ hashes, tag })));
  }

  @Get(':tag')
  @CacheTTL(60)
  @UseInterceptors(CacheInterceptor)
  @Render('gallery')
  getGallery(@Param('tag') tag: string) {
    return this.getHashes(tag);
  }

  @Get(':tag/data.json')
  @CacheTTL(60)
  @UseInterceptors(CacheInterceptor)
  getGalleryData(@Param('tag') tag: string) {
    return this.getHashes(tag);
  }
}
