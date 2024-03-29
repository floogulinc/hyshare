import {
  CacheInterceptor,
  Controller,
  Get,
  NotFoundException,
  Param,
  Render,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { IsHash } from 'class-validator';
import { map, retry } from 'rxjs';
import { BlockedHashGuard } from 'src/blocked-hash.guard';
import { AppConfig } from 'src/config';
import { HydrusApiService } from 'src/hydrus-api/hydrus-api.service';
import {
  HydrusFileFromAPI,
  HydrusFileType,
  serviceNamesToCurrentTags,
  ServiceNamesToStatusesToTags,
  type,
} from 'src/hydrus-file';
import {
  firstNamespaceTag,
  flattenTagServices,
  getTagValue,
} from 'src/tag-utils';

class ViewFilesParams {
  @IsHash('sha256')
  hash: string;
}
@Controller('view')
export class ViewFileController {
  constructor(
    private readonly hydrusApiService: HydrusApiService,
    private appConfig: AppConfig,
  ) {}

  getTags(file: HydrusFileFromAPI) {
    const serviceNames = this.appConfig.tagServicesToDisplay;
    const tagServices = serviceNamesToCurrentTags(file);
    const newTagServices = {};
    for (const s of serviceNames) {
      if (!tagServices[s]) {
        continue;
      }
      const newTags = tagServices[s].filter(
        (tag) =>
          !this.appConfig.hiddenTags.includes(tag) &&
          !this.appConfig.hiddenNamespaces.find((ft) =>
            tag.startsWith(ft + ':'),
          ),
      );
      if (newTags.length > 0) {
        newTagServices[s] = newTags;
      }
    }
    return newTagServices;
  }

  getFileData(hash: string) {
    return this.hydrusApiService
      .getFileMetadata({
        hashes: [hash],
        detailed_url_information: this.appConfig.showUrls,
        include_notes: this.appConfig.showNotes,
        hide_service_names_tags: false,
      })
      .pipe(
        retry(2),
        map(({ metadata }) => metadata[0]),
        map((file) => this.processFileData(file)),
      );
  }

  private processFileData(file: HydrusFileFromAPI) {
    const {
      hash,
      file_id,
      size,
      mime,
      ext,
      width,
      height,
      has_audio,
      file_services,
      time_modified,
      detailed_known_urls,
      is_inbox,
      is_trashed,
      is_local,
      notes,
      filetype_human,
    } = file;

    if (!file_id || (this.appConfig.errorNonLocal && !is_local)) {
      throw new NotFoundException();
    }

    const tag_services_to_tags = this.getTags(file);

    const file_type = type(mime);
    const fileTypeString =
      file_type !== HydrusFileType.Unsupported
        ? `${HydrusFileType[file_type]} File`
        : 'File';

    const title = this.appConfig.titleFromNamespace
      ? getTagValue(
          firstNamespaceTag(
            flattenTagServices(tag_services_to_tags),
            this.appConfig.titleNamespace,
          ),
        ) ?? fileTypeString
      : fileTypeString;

    const importTimes = file_services.current
      ? Object.values(file_services.current)
          .filter((x) => !!x.time_imported)
          .map((x) => x.time_imported)
      : [];

    const firstImportTime =
      importTimes.length > 0 ? Math.min(...importTimes) : undefined;

    const filteredUrls = detailed_known_urls.filter(
      ({ match_name, url_type }) =>
        this.appConfig.urlTypesToDisplay.includes(url_type) &&
        !this.appConfig.hiddenUrlClassNames.includes(match_name),
    );

    const filteredNotes = Object.fromEntries(
      Object.entries(notes).filter(
        ([name]) =>
          !this.appConfig.hiddenNoteNames.includes(
            name.replace(/ \(\d+\)$/, ''),
          ),
      ),
    );

    return {
      hash,
      size,
      mime,
      ext,
      width,
      height,
      has_audio,
      time_imported: firstImportTime,
      time_modified,
      detailed_known_urls: filteredUrls,
      is_inbox,
      is_trashed,
      is_local,
      notes: filteredNotes,
      tag_services_to_tags,
      file_type,
      title,
      filetype_human,
    };
  }

  @Get(':hash')
  @UseGuards(BlockedHashGuard)
  @UseInterceptors(CacheInterceptor)
  @Render('view-file')
  getGallery(@Param() params: ViewFilesParams) {
    return this.getFileData(params.hash);
  }

  @Get(':hash/data.json')
  @UseGuards(BlockedHashGuard)
  @UseInterceptors(CacheInterceptor)
  getGalleryData(@Param() params: ViewFilesParams) {
    return this.getFileData(params.hash);
  }

  @Get(':hash/embed-video')
  @UseGuards(BlockedHashGuard)
  @UseInterceptors(CacheInterceptor)
  @Render('embed-video')
  getEmbedVideo(@Param() params: ViewFilesParams) {
    return params;
  }
}
