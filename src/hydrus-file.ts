export interface ServiceNamesToStatusesToTags {
  [service: string]: {
    [status: string]: string[];
  };
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

export interface HydrusFileFromAPI {
  file_id: number;
  hash: string;
  size: number;
  mime: string;
  ext: string;
  width: number;
  height: number;
  has_audio: boolean;
  known_urls: string[];
  detailed_known_urls?: DetailedKnownUrl[];
  duration?: number | null;
  num_frames?: number | null;
  num_words?: number | null;
  file_services: {
    current?: FileFileServices;
    deleted?: FileFileServices;
  };
  time_modified: number;
  service_names_to_statuses_to_tags: ServiceNamesToStatusesToTags;
  service_names_to_statuses_to_display_tags: ServiceNamesToStatusesToTags;
  service_keys_to_statuses_to_tags: ServiceNamesToStatusesToTags;
  service_keys_to_statuses_to_display_tags: ServiceNamesToStatusesToTags;
  is_inbox: boolean;
  is_local: boolean;
  is_trashed: boolean;
  notes: {
    [name: string]: string;
  };
}

export enum HydrusFileType {
  Image = 0,
  Video = 1,
  Audio = 2,
  Flash = 3,
  PDF = 4,
  TIFF = 5,
  Unsupported = 99,
}

export enum TagStatus {
  Current = 0,
  Pending = 1,
  Deleted = 2,
  Petitioned = 3,
}

export enum UrlType {
  Post = 0,
  File = 2,
  Gallery = 3,
  Watchable = 4,
  Unknown = 5,
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
  return HydrusFileType.Unsupported;
}

export function serviceNamesToCurrentTags(
  service_names_to_statuses_to_tags: ServiceNamesToStatusesToTags,
) {
  return Object.fromEntries(
    Object.entries(service_names_to_statuses_to_tags).map(([key, value]) => [
      key,
      value[0],
    ]),
  );
}
