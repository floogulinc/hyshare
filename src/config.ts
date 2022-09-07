import {
  IsNumber,
  IsString,
  IsArray,
  IsBoolean,
  IsOptional,
  IsUrl,
  IsHexadecimal,
  Length,
  IsPort,
  Min,
  IsEnum,
  IsHash,
  IsObject,
  IsInt,
} from 'class-validator';
import { UrlType } from 'src/hydrus-file';
import { HydrusSortType } from './hydrus-api/hydrus-sort-type';

export class EnvConfig {
  @IsString()
  @IsPort()
  public readonly HYSHARE_PORT: string = '3000';

  @IsString()
  @IsUrl({
    protocols: ['http', 'https'],
    require_protocol: true,
    allow_fragments: false,
    allow_query_components: false,
    require_tld: false,
  })
  public readonly HYSHARE_HYDRUS_API_URL: string = 'http://localhost:45869/';

  @IsString()
  @IsHexadecimal()
  @Length(64, 64)
  public readonly HYSHARE_HYDRUS_API_KEY!: string;

  @IsString()
  public readonly NODE_ENV: string = 'production';

  @IsBoolean()
  public readonly HYSHARE_LOG_REQUESTS: boolean = false;

  @IsString()
  public readonly HYSHARE_REQUEST_LOG_FORMAT: string = 'common';

  @IsNumber()
  @Min(0)
  public readonly HYSHARE_HYDRUS_API_TIMEOUT: number = 30000;

  @IsString()
  @IsOptional()
  @IsUrl({
    protocols: ['http', 'https'],
    require_protocol: true,
    allow_fragments: false,
    allow_query_components: false,
    require_tld: false,
  })
  public readonly HYSHARE_BASE_URL?: string;

  @IsString()
  @IsOptional()
  public readonly HYSHARE_THUMBNAIL_DIR?: string;
}

export class AppConfig {
  @IsArray()
  @IsString({ each: true })
  public readonly searchTags: string[] = [];

  @IsString()
  public readonly searchPrefix: string = 'hyshare:';

  @IsArray()
  @IsString({ each: true })
  public readonly hiddenTags: string[] = [];

  @IsArray()
  @IsString({ each: true })
  public readonly hiddenNamespaces: string[] = ['hyshare'];

  @IsString()
  @IsOptional()
  public readonly tagServiceToSearch?: string;

  @IsArray()
  @IsString({ each: true })
  public readonly tagServicesToDisplay: string[] = ['all known tags'];

  @IsString()
  @IsOptional()
  public readonly fileServiceToSearch?: string;

  @IsBoolean()
  public readonly showNotes: boolean = true;

  @IsBoolean()
  public readonly showUrls: boolean = true;

  @IsArray()
  @IsEnum(UrlType, { each: true })
  public readonly urlTypesToDisplay: UrlType[] = [0, 3, 4];

  @IsArray()
  @IsString({ each: true })
  public readonly hiddenUrlClassNames: string[] = [];

  @IsBoolean()
  public readonly embedTitle: boolean = true;

  @IsBoolean()
  public readonly titleFromNamespace: boolean = true;

  @IsString()
  public readonly titleNamespace: string = 'title';

  @IsBoolean()
  public readonly fullThumbs: boolean = false;

  @IsBoolean()
  public readonly noRounded: boolean = false;

  @IsBoolean()
  public readonly blackDarkTheme: boolean = false;

  @IsEnum(HydrusSortType)
  @IsOptional()
  public readonly defaultSortType?: HydrusSortType;

  @IsBoolean()
  @IsOptional()
  public readonly defaultSortAsc?: boolean;

  @IsArray()
  @IsHash('sha256', { each: true })
  public readonly blockedHashes: string[] = [];

  @IsObject()
  public readonly redirects: Record<string, string> = {};

  @IsBoolean()
  public readonly errorNonLocal: boolean = false;

  @IsNumber()
  public readonly serverCacheTTL: number = 300;

  @IsInt()
  @Min(0)
  public readonly serverCacheMax: number = 100;

  @IsInt()
  @Min(0)
  public readonly galleryBrowserCacheMaxAge: number = 3600;

  @IsInt()
  @Min(0)
  public readonly viewFileBrowserCacheMaxAge: number = 3600;
}
