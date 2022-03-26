import {
  IsNumber,
  IsString,
  IsArray,
  ArrayContains,
  IsBoolean,
  IsOptional,
} from 'class-validator';

export class EnvConfig {
  @IsNumber()
  public readonly PORT: number = 3000;

  @IsString()
  public readonly HYSHARE_HYDRUS_API_URL!: string;

  @IsString()
  public readonly HYSHARE_HYDRUS_API_KEY!: string;

  @IsString()
  public readonly NODE_ENV: string = 'production';
}

export class AppConfig {
  @IsArray()
  public readonly searchTags: string[] = [];

  @IsString()
  public readonly namespace: string = 'hyshare';

  @IsArray()
  public readonly hiddenTags: string[] = [];

  @IsArray()
  public readonly hiddenNamespaces: string[] = ['hyshare'];

  @IsString()
  @IsOptional()
  public readonly tagServiceToSearch: string;

  @IsArray()
  public readonly tagServicesToDisplay: string[] = ['all known tags'];

  @IsBoolean()
  public readonly showNotes: boolean = true;

  @IsBoolean()
  public readonly showUrls: boolean = true;
}
