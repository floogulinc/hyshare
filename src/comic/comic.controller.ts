import {
  CacheInterceptor,
  Controller,
  Get,
  Param,
  Query,
  Redirect,
  Render,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  IsNotEmpty,
  IsString,
  NotContains,
  Matches,
  IsOptional,
  IsHash,
} from 'class-validator';
import { AppConfig } from 'src/config';
import { HydrusApiService } from 'src/hydrus-api/hydrus-api.service';
import { HydrusFileType, type } from 'src/hydrus-file';
import { ComicPage, ComicPageIndentifier } from './comic';
import { ComicService } from './comic.service';
import { Transform } from 'class-transformer';
import { BlockedHashGuard } from 'src/blocked-hash.guard';
import { AppConfigToggle, ConfigGuard } from 'src/config.guard';

class ComicParams {
  @IsNotEmpty()
  @IsString()
  @NotContains('*')
  @Matches(/^[a-zA-Z0-9][a-zA-Z0-9-_ ]*$/)
  id: string;
}

class ComicPageParams extends ComicParams {
  @IsHash('sha256')
  hash: string;
}

class ComicPageQuery implements ComicPageIndentifier {
  @IsString()
  page: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value), {
    toClassOnly: true,
  })
  chapter?: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value), {
    toClassOnly: true,
  })
  volume?: string;
}

@Controller('comic')
@AppConfigToggle('comicsEnabled')
@UseGuards(ConfigGuard)
export class ComicController {
  constructor(
    private readonly hydrusApiService: HydrusApiService,
    private appConfig: AppConfig,
    private comicService: ComicService,
  ) {}

  processPageData(page: ComicPage, id: string) {
    const file_type = type(page.mime);
    if (file_type !== HydrusFileType.Image) {
      return null;
    }

    return {
      hash: page.hash,
      size: page.size,
      mime: page.mime,
      file_type,
      ext: page.ext,
      width: page.width,
      height: page.height,
      volume: page.volume,
      chapter: page.chapter,
      page: page.page,
    };
  }

  async comicData(id: string) {
    const comic = await this.comicService.getComic(id);
    const pages = comic.pages.map((page) => this.processPageData(page, id));
    return {
      id,
      title: comic.title,
      pages,
    };
  }

  async pageData(id: string, hash: string) {
    const { title, page, next, prev, first, last } =
      await this.comicService.getPage(id, hash);
    const data = this.processPageData(page, id);

    return {
      id,
      title,
      ...data,
      next,
      prev,
      first,
      last,
    };
  }

  @Get(':id/data.json')
  @UseInterceptors(CacheInterceptor)
  getComicData(@Param() params: ComicParams) {
    return this.comicData(params.id);
  }

  @Get(':id')
  @UseInterceptors(CacheInterceptor)
  @Render('comic')
  getComic(@Param() params: ComicParams) {
    return this.comicData(params.id);
  }

  @Get(':id/page')
  @Redirect()
  @UseInterceptors(CacheInterceptor)
  async getPageByQuery(
    @Param() params: ComicParams,
    @Query() query: ComicPageQuery,
  ) {
    const page = await this.comicService.findPage(params.id, query);
    return {
      url: `/comic/${params.id}/${page.hash}`,
    };
  }

  @Get(':id/:hash/data.json')
  @UseGuards(BlockedHashGuard)
  @UseInterceptors(CacheInterceptor)
  getPageData(@Param() params: ComicPageParams) {
    return this.pageData(params.id, params.hash);
  }

  @Get(':id/:hash')
  @Render('comic-page')
  @UseGuards(BlockedHashGuard)
  getPage(@Param() params: ComicPageParams) {
    return this.pageData(params.id, params.hash);
  }
  
}
