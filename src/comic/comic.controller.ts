import {
  CacheInterceptor,
  Controller,
  Get,
  Param,
  Query,
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
} from 'class-validator';
import { AppConfig } from 'src/config';
import { HydrusApiService } from 'src/hydrus-api/hydrus-api.service';
import { HydrusFileType, type } from 'src/hydrus-file';
import { ComicPage, ComicPageIndentifier } from './comic';
import { ComicService } from './comic.service';
import { Transform } from 'class-transformer';
import qs from 'qs';
import { ComicGuard } from './comic.guard';

class ComicParams {
  @IsNotEmpty()
  @IsString()
  @NotContains('*')
  @Matches(/^[a-zA-Z0-9][a-zA-Z0-9-_ ]*$/)
  id: string;
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
@UseGuards(ComicGuard)
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

    const url = this.getPageUrl(id, {
      volume: page.volume,
      chapter: page.chapter,
      page: page.page,
    });

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
      url,
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

  getPageUrl(
    id: string,
    pageInfo: { page: string; chapter?: string; volume?: string },
  ) {
    const query = qs.stringify(pageInfo, {
      skipNulls: true,
    });
    return `/comic/${id}/page?${query}`;
  }

  async pageData(id: string, pageId: ComicPageIndentifier) {
    const { title, page, next, prev, first, last } =
      await this.comicService.getPage(id, pageId);
    const data = this.processPageData(page, id);

    return {
      id,
      title,
      ...data,
      next,
      nextUrl: next && this.getPageUrl(id, next),
      prev,
      prevUrl: prev && this.getPageUrl(id, prev),
      first,
      firstUrl: this.getPageUrl(id, first),
      last,
      lastUrl: this.getPageUrl(id, last),
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

  @Get(':id/page/data.json')
  @UseInterceptors(CacheInterceptor)
  getPageData(@Param() params: ComicParams, @Query() query: ComicPageQuery) {
    return this.pageData(params.id, query);
  }

  @Get(':id/page')
  @Render('comic-page')
  @UseInterceptors(CacheInterceptor)
  getPage(@Param() params: ComicParams, @Query() query: ComicPageQuery) {
    return this.pageData(params.id, query);
  }
}
