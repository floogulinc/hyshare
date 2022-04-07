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
} from '@nestjs/common';
import { HydrusApiService } from './hydrus-api/hydrus-api.service';
import { Request, Response } from 'express';
import { IsHash } from 'class-validator';
import ms from 'ms';
import { BlockedHashGuard } from './blocked-hash.guard';

class FileParams {
  @IsHash('sha256')
  hash: string;
}

@Controller()
export class AppController {
  constructor(private readonly hydrusApiService: HydrusApiService) {}

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
    const thumb = await this.hydrusApiService.getThumbnailStream(
      params.hash,
      req.headers,
    );
    res
      .status(thumb.status)
      .header(thumb.headers)
      .setHeader('Cache-Control', `public, max-age=${ms('1y') / 1000}`);
    thumb.data.pipe(res);
  }

  @Get('file/:hash')
  @UseGuards(BlockedHashGuard)
  async getFile(
    @Param() params: FileParams,
    @Req() req: Request,
    @Res() res: Response,
  ) {
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
  }
}
