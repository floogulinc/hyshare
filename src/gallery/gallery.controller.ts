import {
  CacheInterceptor,
  Controller,
  ForbiddenException,
  Get,
  Header,
  Param,
  Query,
  Render,
  UseInterceptors,
} from '@nestjs/common';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  NotContains,
} from 'class-validator';
import ms from 'ms';
import { map } from 'rxjs';
import { AppConfig } from 'src/config';
import { HydrusApiService } from 'src/hydrus-api/hydrus-api.service';
import { HydrusSortType } from 'src/hydrus-api/hydrus-sort-type';

class GalleryParams {
  @IsNotEmpty()
  @IsString()
  @NotContains('*')
  tag: string;
}

class GalleryQueryParams {
  @IsOptional()
  @IsEnum(HydrusSortType)
  @Transform(({ value }) => parseInt(value), { toClassOnly: true })
  //@Type(() => Number)
  sort_type: HydrusSortType;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true', { toClassOnly: true })
  sort_asc: boolean;
}

@Controller('gallery')
export class GalleryController {
  constructor(
    private readonly hydrusApiService: HydrusApiService,
    private appConfig: AppConfig,
  ) {}

  getHashes(tag: string, sortType?: HydrusSortType, sortAsc?: boolean) {
    if (sortType && !this.appConfig.allowedSortTypes.includes(sortType)) {
      throw new ForbiddenException();
    }

    return this.hydrusApiService
      .searchFiles(
        [`${this.appConfig.searchPrefix}${tag}`, ...this.appConfig.searchTags],
        {
          return_hashes: true,
          return_file_ids: false,
          tag_service_name: this.appConfig.tagServiceToSearch,
          file_sort_type: sortType,
          file_sort_asc: sortAsc,
        },
      )
      .pipe(map(({ hashes }) => ({ hashes, title: tag })));
  }

  @Get(':tag')
  @UseInterceptors(CacheInterceptor)
  @Header('Cache-Control', `public, max-age=${ms('60m') / 1000}`)
  @Render('gallery')
  getGallery(
    @Param() params: GalleryParams,
    @Query() query: GalleryQueryParams,
  ) {
    return this.getHashes(params.tag, query.sort_type, query.sort_asc);
  }

  @Get(':tag/data.json')
  @UseInterceptors(CacheInterceptor)
  getGalleryData(
    @Param() params: GalleryParams,
    @Query() query: GalleryQueryParams,
  ) {
    return this.getHashes(params.tag, query.sort_type, query.sort_asc);
  }
}
