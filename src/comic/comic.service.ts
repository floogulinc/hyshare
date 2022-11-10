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

  processComicPage(file: HydrusFileFromAPI): ComicPage {
    const tagServices = serviceNamesToCurrentTags(
      file.service_names_to_statuses_to_display_tags,
    );

    const tags = flattenTagServices(tagServices);

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

  getComicFromApi(id: string): Observable<Comic> {
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
            ? this.hydrusApiService.getFileMetadata({ hashes })
            : of({ metadata: [] }),
        ),
        map(({ metadata }) =>
          metadata.map(this.processComicPage).filter((p) => !!p.page),
        ),
        map((pages) => this.sortPages(pages)),
        map((pages) => ({ title: id, pages })),
      );
  }

  async getComic(id: string): Promise<Comic> {
    const comicFromCache = await this.cacheManager.get<Comic>(`comic-${id}`);
    if (comicFromCache) {
      this.logger.log(`Comic cache HIT (${id})`);
      return comicFromCache;
    }
    this.logger.log(`Comic cache MISS (${id})`);
    const comicFromApi = await firstValueFrom(this.getComicFromApi(id));
    this.cacheManager.set(`comic-${id}`, comicFromApi);
    return comicFromApi;
  }

  processNextPrevPage(page: ComicPage) {
    if (!page) {
      return null;
    }
    return {
      volume: page.volume,
      chapter: page.chapter,
      page: page.page,
    };
  }

  async getPage(id: string, pageId: ComicPageIndentifier) {
    console.log(pageId);
    const comic = await this.getComic(id);
    const index = comic.pages.findIndex(
      (value) =>
        value.page === pageId.page &&
        value.chapter === pageId.chapter &&
        value.volume === pageId.volume,
    );
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
}
