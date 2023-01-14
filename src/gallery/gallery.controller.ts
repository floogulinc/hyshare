import {
  CacheInterceptor,
  Controller,
  Get,
  NotFoundException,
  Param,
  Render,
  StreamableFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { IsNotEmpty, IsString, Matches, NotContains } from 'class-validator';
import { firstValueFrom, map, retry } from 'rxjs';
import { AppConfig } from 'src/config';
import { HydrusApiService } from 'src/hydrus-api/hydrus-api.service';
import { parse } from 'content-disposition';
import { GalleryDownloadGuard } from './gallery-download.guard';
import { createZipStream } from 'src/create-zip-stream';

class GalleryParams {
  @IsNotEmpty()
  @IsString()
  @NotContains('*')
  @Matches(/^[a-zA-Z0-9][a-zA-Z0-9-_ ]*$/)
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
          file_service_name: this.appConfig.fileServiceToSearch,
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
          tag,
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

  async filePromise(hash: string) {
    const file = await this.hydrusApiService.getFileStream(hash);
    const filename = parse(file.headers['content-disposition']).parameters
      .filename as string;
    return { stream: file.data, name: filename };
  }

  @Get(':tag/download')
  @UseGuards(GalleryDownloadGuard)
  async getGalleryDownload(@Param() params: GalleryParams) {
    const { hashes } = await firstValueFrom(
      this.getHashes(params.tag).pipe(retry(2)),
    );
    if (hashes.length < 1) {
      throw new NotFoundException();
    }
    const filePromises = hashes.map((hash) => () => this.filePromise(hash));
    const archive = createZipStream(filePromises, { store: true });

    return new StreamableFile(archive, {
      type: 'application/zip',
      disposition: `attachment; filename="${params.tag}.zip"`,
    });
  }
}
