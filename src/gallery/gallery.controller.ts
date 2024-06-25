import {
  CacheInterceptor,
  Controller,
  Get,
  Header,
  NotFoundException,
  Param,
  Redirect,
  Render,
  StreamableFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { IsNotEmpty, IsString, Matches, NotContains } from 'class-validator';
import { firstValueFrom, lastValueFrom, map, retry } from 'rxjs';
import { AppConfig } from 'src/config';
import { HydrusApiService } from 'src/hydrus-api/hydrus-api.service';
import { parse } from 'content-disposition';
import { createZipStream } from 'src/create-zip-stream';
import { AppConfigToggle, ConfigGuard } from 'src/config.guard';

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
    const file = await lastValueFrom(
      this.hydrusApiService.getFileStream(hash).pipe(retry(2)),
    );
    const filename = parse(file.headers['content-disposition']).parameters
      .filename as string;
    return { stream: file.data, name: filename };
  }

  @Get(':tag/download')
  @AppConfigToggle('galleryDownloadEnabled')
  @UseGuards(ConfigGuard)
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
    }).setErrorHandler((err, res) => {
      // see https://github.com/nestjs/nest/issues/10681
      // and https://github.com/nestjs/nest/pull/10895

      if (res.destroyed) {
        return;
      }
      if ((res as any).headersSent) {
        (res as any).end();
        return;
      }
      res.statusCode = 500;
      res.send(err.message);
    });
  }

  @Get(':tag/random')
  @Redirect()
  @Header('Cache-Control', 'no-cache')
  @AppConfigToggle('galleryRandomEnabled')
  @UseGuards(ConfigGuard)
  async random(@Param() params: GalleryParams) {
    const { hashes } = await firstValueFrom(
      this.getHashes(params.tag).pipe(retry(2)),
    );
    if (hashes.length < 1) {
      throw new NotFoundException();
    }
    const hash = hashes[Math.floor(Math.random() * hashes.length)];
    return {
      url: `/view/${hash}`,
    };
  }

  @Get(':tag/random/file')
  @Redirect()
  @Header('Cache-Control', 'no-cache')
  @AppConfigToggle('galleryRandomEnabled')
  @UseGuards(ConfigGuard)
  async randomFile(@Param() params: GalleryParams) {
    const { hashes } = await firstValueFrom(
      this.getHashes(params.tag).pipe(retry(2)),
    );
    if (hashes.length < 1) {
      throw new NotFoundException();
    }
    const hash = hashes[Math.floor(Math.random() * hashes.length)];
    return {
      url: `/file/${hash}`,
    };
  }
}
