import {
  CACHE_MANAGER,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Cache } from 'cache-manager';
import { firstValueFrom, map, Observable, of, switchMap } from 'rxjs';
import { AppConfig } from 'src/config';
import { HydrusApiService } from 'src/hydrus-api/hydrus-api.service';
import { HydrusFileFromAPI, serviceNamesToCurrentTags } from 'src/hydrus-file';
import {
  firstNamespaceTag,
  flattenTagServices,
  getTagValue,
} from 'src/tag-utils';
import { Comic, ComicPage, ComicPageIndentifier } from './comic';

@Injectable()
export class ComicService {
  constructor(
    private readonly hydrusApiService: HydrusApiService,
    private appConfig: AppConfig,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  private readonly logger = new Logger(ComicService.name);

  getFlatTags(file: HydrusFileFromAPI) {
    const serviceNames = this.appConfig.comicTagServices;
    const tagServices = serviceNamesToCurrentTags(file);
    return serviceNames.map((sn) => tagServices[sn] ?? []).flat();
  }

  processComicPage(file: HydrusFileFromAPI): ComicPage {
    const tags = this.getFlatTags(file);

    const volume = getTagValue(firstNamespaceTag(tags, 'volume'));
    const chapter = getTagValue(firstNamespaceTag(tags, 'chapter'));
    const page = getTagValue(firstNamespaceTag(tags, 'page'));

    return {
      ...file,
      volume,
      chapter,
      page,
    };
  }

  getTitle(page: ComicPage) {
    const tags = this.getFlatTags(page);

    return getTagValue(firstNamespaceTag(tags, 'title'));
  }

  collator = new Intl.Collator(undefined, {
    numeric: true,
    sensitivity: 'variant',
  });

  compareTag(a: string, b: string): number {
    if (!a || !b) {
      return a ? (b ? 0 : 1) : b ? -1 : 1;
    }
    return this.collator.compare(a, b);
  }

  sortPages(pages: ComicPage[]) {
    return [...pages]
      .sort((a, b) => this.compareTag(a.page, b.page))
      .sort((a, b) => this.compareTag(a.chapter, b.chapter))
      .sort((a, b) => this.compareTag(a.volume, b.volume));
  }

  getComicPagesFromApi(id: string): Observable<ComicPage[]> {
    return this.hydrusApiService
      .searchFiles(
        [
          `${this.appConfig.comicSearchPrefix}${id}`,
          ...this.appConfig.comicSearchTags,
        ],
        {
          return_hashes: true,
          return_file_ids: false,
          tag_service_name: this.appConfig.tagServiceToSearch,
          file_service_name: this.appConfig.fileServiceToSearch,
        },
      )
      .pipe(
        switchMap(({ hashes }) =>
          hashes.length > 0
            ? this.hydrusApiService.getFileMetadata({
                hashes,
                hide_service_names_tags: false,
              })
            : of({ metadata: [] }),
        ),
        map(({ metadata }) =>
          metadata.map((p) => this.processComicPage(p)).filter((p) => !!p.page),
        ),
        map((pages) => this.sortPages(pages)),
      );
  }

  async getComic(id: string): Promise<Comic> {
    const comicFromCache = await this.cacheManager.get<Comic>(`comic-${id}`);
    if (comicFromCache) {
      this.logger.debug(`Comic cache HIT (${id})`);
      return comicFromCache;
    }
    this.logger.debug(`Comic cache MISS (${id})`);
    const pages = await firstValueFrom(this.getComicPagesFromApi(id));
    const title =
      this.appConfig.comicTitleFromNamespace && pages[0]
        ? this.getTitle(pages[0]) ?? id
        : id;
    const comicFromApi = {
      title,
      pages,
    };
    this.cacheManager.set(`comic-${id}`, comicFromApi);
    return comicFromApi;
  }

  processNextPrevPage(page: ComicPage) {
    if (!page) {
      return null;
    }
    return {
      hash: page.hash,
      volume: page.volume,
      chapter: page.chapter,
      page: page.page,
    };
  }

  async getPage(id: string, hash: string) {
    const comic = await this.getComic(id);
    const index = comic.pages.findIndex((value) => value.hash === hash);
    if (index < 0) {
      throw new NotFoundException();
    }
    const next = comic.pages[index + 1];
    const prev = index === 0 ? null : comic.pages[index - 1];
    const first = comic.pages[0];
    const last = comic.pages[comic.pages.length - 1];
    return {
      title: comic.title,
      page: comic.pages[index],
      next: this.processNextPrevPage(next),
      prev: this.processNextPrevPage(prev),
      first: this.processNextPrevPage(first),
      last: this.processNextPrevPage(last),
    };
  }

  async findPage(id: string, pageId: ComicPageIndentifier) {
    const comic = await this.getComic(id);
    const page = comic.pages.find(
      (value) =>
        value.page === pageId.page &&
        value.chapter === pageId.chapter &&
        value.volume === pageId.volume,
    );
    if (!page) {
      throw new NotFoundException();
    }
    return page;
  }
}
