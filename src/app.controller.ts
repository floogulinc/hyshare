import { Controller, Get, Next, Param, Render, Req, Res, Headers } from '@nestjs/common';
import { tap } from 'rxjs';
import { AppService } from './app.service';
import { HydrusApiService } from './hydrus-api/hydrus-api.service';
import { Request, Response } from 'express';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService, private readonly hydrusApiService: HydrusApiService) {}

  @Get()
  @Render('index')
  getHello() {
    //return this.appService.getHello();
    //return { message: 'Hello world!' };
  }

  @Get('thumbnail/:hash')
  async getThumbnail(@Param('hash') hash: string, @Req() req: Request, @Res() res: Response) {
    const thumb = await this.hydrusApiService.getThumbnailStream(hash);
    res.status(thumb.status).header(thumb.headers);
    thumb.data.pipe(res);
  }

  @Get('file/:hash')
  async getFile(@Param('hash') hash: string, @Req() req: Request, @Res() res: Response) {
    const thumb = await this.hydrusApiService.getFileStream(hash, req.headers);
    res.status(thumb.status).header(thumb.headers);
    thumb.data.pipe(res);
  }


}
