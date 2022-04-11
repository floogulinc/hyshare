import {
  CacheInterceptor,
  Controller,
  Get,
  Header,
  Param,
  Render,
  Res,
  UseInterceptors,
} from '@nestjs/common';
import { IsNotEmpty, IsString, NotContains } from 'class-validator';
import ms from 'ms';
import { map, retry } from 'rxjs';
import { AppConfig } from 'src/config';
import { HydrusApiService } from 'src/hydrus-api/hydrus-api.service';
import { Response } from 'express';

class GalleryParams {
  @IsNotEmpty()
  @IsString()
  @NotContains('*')
  tag: string;
}

@Controller('gallery')
export class GalleryController {
  constructor(
    private readonly hydrusApiService: HydrusApiService,
    private appConfig: AppConfig,
  ) {}

  getHashes(tag: string) {
    return this.hydrusApiService
      .searchFiles(
        [`${this.appConfig.searchPrefix}${tag}`, ...this.appConfig.searchTags],
        {
          return_hashes: true,
          return_file_ids: false,
          tag_service_name: this.appConfig.tagServiceToSearch,
          file_sort_type: this.appConfig.defaultSortType,
          file_sort_asc: this.appConfig.defaultSortAsc,
        },
      )
      .pipe(
        retry(2),
        map(({ hashes }) => ({
          hashes: hashes.filter(
            (hash) => !this.appConfig.blockedHashes.includes(hash),
          ),
          title: tag,
        })),
      );
  }

  @Get(':tag')
  @UseInterceptors(CacheInterceptor)
  @Render('gallery')
  getGallery(@Param() params: GalleryParams) {
    return this.getHashes(params.tag);
  }

  @Get(':tag/data.json')
  @UseInterceptors(CacheInterceptor)
  getGalleryData(@Param() params: GalleryParams) {
    return this.getHashes(params.tag);
  }
}
