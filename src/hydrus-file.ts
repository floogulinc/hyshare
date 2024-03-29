export enum HydrusServiceType {
  TAG_REPOSITORY = 0,
  FILE_REPOSITORY = 1,
  LOCAL_FILE_DOMAIN = 2,
  MESSAGE_DEPOT = 3,
  LOCAL_TAG = 5,
  LOCAL_RATING_NUMERICAL = 6,
  LOCAL_RATING_LIKE = 7,
  RATING_NUMERICAL_REPOSITORY = 8,
  RATING_LIKE_REPOSITORY = 9,
  COMBINED_TAG = 10,
  COMBINED_FILE = 11,
  LOCAL_BOORU = 12,
  IPFS = 13,
  LOCAL_FILE_TRASH_DOMAIN = 14,
  COMBINED_LOCAL_FILE = 15,
  TEST_SERVICE = 16,
  LOCAL_NOTES = 17,
  CLIENT_API_SERVICE = 18,
  COMBINED_DELETED_FILE = 19,
  LOCAL_FILE_UPDATE_DOMAIN = 20,
  COMBINED_LOCAL_MEDIA = 21,
  SERVER_ADMIN = 99,
  NULL_SERVICE = 100,
}

export interface ServiceNamesToStatusesToTags {
  [service: string]: StatusesToTags;
}

export interface StatusesToTags {
  [status: string]: string[];
}

export interface FileFileServices {
  [service_id: string]: {
    time_imported?: number;
    time_deleted?: number;
  };
}

export interface DetailedKnownUrl {
  normalised_url: string;
  url_type: UrlType;
  url_type_string: string;
  match_name: string;
  can_parse: boolean;
}

export type HydrusTagServiceType =
  | HydrusServiceType.TAG_REPOSITORY
  | HydrusServiceType.LOCAL_TAG
  | HydrusServiceType.COMBINED_TAG;

export interface HydrusTagService {
  name: string;
  type: HydrusTagServiceType;
  type_pretty: string;
  storage_tags: StatusesToTags;
  display_tags: StatusesToTags;
}

export enum UrlType {
  Post = 0,
  File = 2,
  Gallery = 3,
  Watchable = 4,
  Unknown = 5,
}

export interface HydrusNotes {
  [name: string]: string;
}

interface RatingsFromAPI {
  [service_key: string]: boolean | number | null;
}

export interface HydrusFileFromAPI {
  file_id: number;
  hash: string;
  size: number;
  mime: string;
  ext: string;
  width: number;
  height: number;
  duration?: number;
  has_audio: boolean;
  num_frames?: number;
  num_words?: number;

  // TODO: make non-optional when v540 is minimum
  filetype_human?: string; // added in v540
  filetype_enum?: number; //added in v540
  blurhash?: string; // added in v545

  known_urls: string[];
  file_services: {
    current?: FileFileServices;
    deleted?: FileFileServices;
  };
  time_modified: number;
  service_names_to_statuses_to_tags?: ServiceNamesToStatusesToTags; // removed in v514
  service_names_to_statuses_to_display_tags?: ServiceNamesToStatusesToTags; // removed in v514
  service_keys_to_statuses_to_tags?: ServiceNamesToStatusesToTags;
  service_keys_to_statuses_to_display_tags?: ServiceNamesToStatusesToTags;
  is_inbox: boolean;
  is_local: boolean;
  is_trashed: boolean;

  notes?: HydrusNotes;

  // added in v506
  // all known tags added in v507
  tags: {
    [serviceKey: string]: HydrusTagService
  };

  detailed_known_urls?: DetailedKnownUrl[];

  ipfs_multihashes?: Record<string, string>;

  ratings?: RatingsFromAPI;

  has_exif?: boolean; // added in v506
  has_human_readable_embedded_metadata?: boolean; // added in v506
  has_icc_profile?: boolean; // added in v506
  has_transparency?: boolean; // added in v552

  thumbnail_width?: number; // added in v506
  thumbnail_height?: number; // added in v506

  time_modified_details?: Record<string, number>; // added in v506

  is_deleted?: boolean; // added in v506
}


export enum HydrusFileType {
  Image = 0,
  Video = 1,
  Audio = 2,
  Flash = 3,
  PDF = 4,
  TIFF = 5,
  SVG = 6,
  Unsupported = 99,
}

export enum TagStatus {
  Current = 0,
  Pending = 1,
  Deleted = 2,
  Petitioned = 3,
}

export function type(mime: string): HydrusFileType {
  if (
    [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/apng',
      'image/gif',
      'image/bmp',
      'image/webp',
      'image/avif',
      'image/avif-sequence',
    ].includes(mime)
  ) {
    return HydrusFileType.Image;
  }
  if (
    ['video/mp4', 'video/webm', 'video/x-matroska', 'video/quicktime'].includes(
      mime,
    )
  ) {
    return HydrusFileType.Video;
  }
  if (['audio/mp3', 'audio/ogg', 'audio/flac', 'audio/x-wav'].includes(mime)) {
    return HydrusFileType.Audio;
  }
  if (['video/x-flv', 'application/x-shockwave-flash'].includes(mime)) {
    return HydrusFileType.Flash;
  }
  if (['application/pdf'].includes(mime)) {
    return HydrusFileType.PDF;
  }
  if (['image/tiff'].includes(mime)) {
    return HydrusFileType.TIFF;
  }
  if (['image/svg+xml'].includes(mime)) {
    return HydrusFileType.SVG;
  }
  return HydrusFileType.Unsupported;
}

export function serviceNamesToCurrentTags(
  file: HydrusFileFromAPI,
  displayTags = true,
) {
  if (file.tags) {
    // hydrus 507+
    return Object.fromEntries(
      Object.values(file.tags)
        .map((service) => [
          service.name,
          displayTags ? service.display_tags[0] : service.storage_tags[0],
        ])
        .filter(([, tags]) => tags),
    );
  } else {
    // removed in hydrus 514
    const service_names_to_statuses_to_tags = displayTags
      ? file.service_names_to_statuses_to_display_tags
      : file.service_names_to_statuses_to_tags;
    return Object.fromEntries(
      Object.entries(service_names_to_statuses_to_tags).map(([key, value]) => [
        key,
        value[0],
      ]),
    );
  }
}
