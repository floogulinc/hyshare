export interface ServiceNamesToStatusesToTags {
  [service: string]: {
    [status: string]: string[];
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
  service_names_to_statuses_to_tags: ServiceNamesToStatusesToTags;
  service_names_to_statuses_to_display_tags: ServiceNamesToStatusesToTags; // Hydrus 419+
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
  Image,
  Video,
  Audio,
  Flash,
  Unsupported,
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
