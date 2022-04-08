import {
  Controller,
  Get,
  Param,
  Render,
  Req,
  Res,
  Header,
  CacheInterceptor,
  UseInterceptors,
  UseGuards,
  HttpException,
  Redirect,
  NotFoundException,
} from '@nestjs/common';
import { HydrusApiService } from './hydrus-api/hydrus-api.service';
import { Request, Response } from 'express';
import { IsHash } from 'class-validator';
import ms from 'ms';
import { BlockedHashGuard } from './blocked-hash.guard';
import { join } from 'path';
import { stat } from 'fs/promises';
import { AppConfig, EnvConfig } from './config';

class FileParams {
  @IsHash('sha256')
  hash: string;
}

@Controller()
export class AppController {
  constructor(
    private readonly hydrusApiService: HydrusApiService,
    private env: EnvConfig,
    private appConfig: AppConfig
  ) {}

  @Get()
  @Render('index')
  @Header('Cache-Control', `public, max-age=${ms('1d') / 1000}`)
  @UseInterceptors(CacheInterceptor)
  getIndex() {
    return;
  }

  @Get('thumbnail/:hash')
  @UseGuards(BlockedHashGuard)
  async getThumbnail(
    @Param() params: FileParams,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const { hash } = params;
    if (this.env.HYSHARE_THUMBNAIL_DIR) {
      const filename = `./t${hash.substring(0, 2)}/${hash}.thumbnail`;
      const path = join(this.env.HYSHARE_THUMBNAIL_DIR, filename);
      try {
        const statResult = await stat(path);
        if (statResult.isFile()) {
          res.sendFile(path, { maxAge: '1y' });
          return;
        }
      } catch {}
    }
    try {
      const thumb = await this.hydrusApiService.getThumbnailStream(
        hash,
        req.headers,
      );
      res
        .status(thumb.status)
        .header(thumb.headers)
        .setHeader('Cache-Control', `public, max-age=${ms('1y') / 1000}`);
      thumb.data.pipe(res);
    } catch (error) {
      if (error.response) {
        throw new HttpException(
          error.response.statusText,
          error.response.status,
        );
      } else {
        throw error;
      }
    }
  }

  @Get('file/:hash')
  @UseGuards(BlockedHashGuard)
  async getFile(
    @Param() params: FileParams,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      const file = await this.hydrusApiService.getFileStream(
        params.hash,
        req.headers,
      );
      res
        .status(file.status)
        .header(file.headers)
        .setHeader(
          'Cache-Control',
          `public, max-age=${ms('1y') / 1000}, immutable`,
        );
      file.data.pipe(res);
    } catch (error) {
      if (error.response) {
        throw new HttpException(
          error.response.statusText,
          error.response.status,
        );
      } else {
        throw error;
      }
    }
  }

  @Get(':path')
  @Redirect()
  redirects(@Param('path') path: string) {
    if (path in this.appConfig.redirects) {
      return { url: this.appConfig.redirects[path] };
    } else {
      throw new NotFoundException();
    }
  }
}
