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
  StreamableFile,
} from '@nestjs/common';
import { HydrusApiService } from './hydrus-api/hydrus-api.service';
import { Request, Response } from 'express';
import { IsHash } from 'class-validator';
import ms from 'ms';
import { BlockedHashGuard } from './blocked-hash.guard';
import { join } from 'path';
import { stat } from 'fs/promises';
import { createReadStream } from 'fs';
import { AppConfig, EnvConfig } from './config';
import { lastValueFrom, Observable } from 'rxjs';
import { AxiosResponse } from 'axios';
import { IncomingMessage } from 'http';
import { handleStreamError } from './stream-error-handler';

class FileParams {
  @IsHash('sha256')
  hash: string;
}

const oneYearSeconds = ms('1y') / 1000;

@Controller()
export class AppController {
  constructor(
    private readonly hydrusApiService: HydrusApiService,
    private env: EnvConfig,
    private appConfig: AppConfig,
  ) {}

  @Get()
  @Render('index')
  @Header('Cache-Control', `public, max-age=${oneYearSeconds}`)
  @UseInterceptors(CacheInterceptor)
  getIndex() {
    return;
  }

  @Get('thumbnail/:hash')
  @UseGuards(BlockedHashGuard)
  async getThumbnail(
    @Param() params: FileParams,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { hash } = params;
    if (this.env.HYSHARE_THUMBNAIL_DIR) {
      const filename = `./t${hash.substring(0, 2)}/${hash}.thumbnail`;
      const path = join(this.env.HYSHARE_THUMBNAIL_DIR, filename);
      try {
        const statResult = await stat(path);
        if (statResult.isFile()) {
          if (res.destroyed) {
            return;
          }
          res.setHeader('Cache-Control', 'public, max-age=31536000');
          return new StreamableFile(createReadStream(path), {
            length: statResult.size,
          }).setErrorHandler(handleStreamError);
        }
      } catch {}
    }
    return this.streamResponse(
      res,
      () => this.hydrusApiService.getThumbnailStream(hash, req.headers),
      { 'Cache-Control': `public, max-age=${oneYearSeconds}` },
    );
  }

  @Get('file/:hash')
  @UseGuards(BlockedHashGuard)
  async getFile(
    @Param() params: FileParams,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.streamResponse(
      res,
      () => this.hydrusApiService.getFileStream(params.hash, req.headers),
      {
        'Cache-Control': `public, max-age=${oneYearSeconds}, immutable`,
        'Content-Security-Policy': 'sandbox',
      },
    );
  }

  private async streamResponse(
    res: Response,
    fetch: () => Observable<AxiosResponse<IncomingMessage>>,
    headers: Record<string, string | string[] | number>,
  ) {
    let source: IncomingMessage;
    try {
      if (res.destroyed) {
        return;
      }
      const file = await lastValueFrom(fetch());
      source = file.data;
      if (res.destroyed) {
        source.destroy();
        return;
      }
      res.status(file.status).header(file.headers).header(headers);
      return new StreamableFile(source).setErrorHandler(handleStreamError);
    } catch (error) {
      source?.destroy();
      if (res.destroyed) {
        return;
      }
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
