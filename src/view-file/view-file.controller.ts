import { CacheInterceptor, CacheTTL, Controller, Get, Param, Render, UseInterceptors } from '@nestjs/common';
import { map } from 'rxjs';
import { AppConfig } from 'src/config';
import { HydrusApiService } from 'src/hydrus-api/hydrus-api.service';
import {
  serviceNamesToCurrentTags,
  ServiceNamesToStatusesToTags,
  type,
} from 'src/hydrus-file';

@Controller('view')
export class ViewFileController {
  constructor(
    private readonly hydrusApiService: HydrusApiService,
    private appConfig: AppConfig,
  ) {}

  getTags(
    service_names_to_statuses_to_display_tags: ServiceNamesToStatusesToTags,
  ) {
    const serviceNames = this.appConfig.tagServicesToDisplay;
    const tagServices = serviceNamesToCurrentTags(
      service_names_to_statuses_to_display_tags,
    );
    const newTagServices = {};
    for (const s of serviceNames) {
      newTagServices[s] = tagServices[s].filter(
        (tag) =>
          !this.appConfig.hiddenTags.includes(tag) &&
          !this.appConfig.hiddenNamespaces.find((ft) =>
            tag.startsWith(ft + ':'),
          ),
      );
    }
    return newTagServices;
  }

  getFileData(hash: string) {
    console.log(`get ${hash}`);
    return this.hydrusApiService
      .getFileMetadata({ 
        hashes: [hash], 
        detailed_url_information: this.appConfig.showUrls,
        include_notes: this.appConfig.showNotes,
      })
      .pipe(
        map(({ metadata }) => metadata[0]),
        map(
          ({
            hash,
            size,
            mime,
            ext,
            width,
            height,
            has_audio,
            detailed_known_urls,
            service_names_to_statuses_to_display_tags,
            is_inbox,
            is_trashed,
            notes,
          }) => ({
            hash,
            size,
            mime,
            ext,
            width,
            height,
            has_audio,
            detailed_known_urls,
            is_inbox,
            is_trashed,
            notes,
            tag_services_to_tags: this.getTags(
              service_names_to_statuses_to_display_tags,
            ),
            file_type: type(mime),
          }),
        ),
      );
  }

  @Get(':hash')
  @CacheTTL(60)
  @UseInterceptors(CacheInterceptor)
  @Render('view-file')
  getGallery(@Param('hash') hash: string) {
    return this.getFileData(hash);
  }

  @Get(':hash/data.json')
  //@CacheTTL(60)
  //@UseInterceptors(CacheInterceptor)
  getGalleryData(@Param('hash') hash: string) {
    return this.getFileData(hash);
  }
}
