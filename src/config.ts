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

  @IsNumber()
  @Min(0)
  public readonly HYSHARE_CACHE_TTL: number = 60;

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
}

export class AppConfig {
  @IsArray()
  public readonly searchTags: string[] = [];

  @IsString()
  public readonly searchPrefix: string = 'hyshare:';

  @IsArray()
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

  @IsBoolean()
  public readonly showNotes: boolean = true;

  @IsBoolean()
  public readonly showUrls: boolean = true;

  @IsArray()
  @IsEnum(UrlType, { each: true })
  public readonly urlTypesToDisplay: UrlType[] = [0, 3, 4];

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
}