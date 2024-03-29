import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { AxiosRequestConfig } from 'axios';
import { map, Observable } from 'rxjs';
import { EnvConfig } from '../config';
import { HydrusFileFromAPI } from 'src/hydrus-file';
import { HydrusSortType } from './hydrus-sort-type';
import { IncomingMessage } from 'http';

@Injectable()
export class HydrusApiService {
  constructor(private envConfig: EnvConfig, private http: HttpService) {}

  private readonly logger = new Logger(HydrusApiService.name);

  hydrusApiUrl: string = this.envConfig.HYSHARE_HYDRUS_API_URL;

  hydrusApiKey: string = this.envConfig.HYSHARE_HYDRUS_API_KEY;

  apiUrl = this.hydrusApiUrl + (this.hydrusApiUrl.endsWith('/') ? '' : '/');

  headers = {
    'Hydrus-Client-API-Access-Key': this.hydrusApiKey,
  };

  private apiGet<T = any>(
    path: string,
    params?,
    extraConfig?: AxiosRequestConfig,
  ) {
    return this.http.get<T>(this.apiUrl + path, {
      params,
      headers: this.headers,
      ...extraConfig,
    });
  }

  /**
   * GET /get_files/search_files
   *
   * Search for the client's files.
   * @param tags (a list of tags you wish to search for)
   * @param params additional parameters
   * @returns The full list of numerical file ids or hashes that match the search.
   */
  public searchFiles<Hashes extends boolean, IDs extends boolean>(
    tags: string[],
    params: {
      file_service_name?: string;
      file_service_key?: string;
      tag_service_name?: string;
      tag_service_key?: string;
      file_sort_type?: HydrusSortType;
      file_sort_asc?: boolean;
      return_hashes?: Hashes;
      return_file_ids?: IDs;
    } = {},
  ): Observable<
    (Hashes extends true ? { hashes: string[] } : Record<string, never>) &
      (IDs extends true ? { file_ids: number[] } : Record<string, never>)
  > {
    return this.apiGet('get_files/search_files', {
      tags: JSON.stringify(tags),
      ...params,
    }).pipe(map((resp) => resp.data));
  }

  /**
   * GET /get_files/file_metadata
   *
   * Get metadata about files in the client.
   * @param params.file_ids (a list of numerical file ids)
   * @param params.hashes (a list of hexadecimal SHA256 hashes)
   * @param params.only_return_identifiers true or false (optional, defaulting to false)
   * @param params.detailed_url_information true or false (optional, defaulting to false)
   * @param params.hide_service_names_tags true or false (optional, defaulting to false, true in v506+)
   * @param params.include_notes true or false (optional, defaulting to false)
   * @returns  A list of JSON Objects that store a variety of file metadata.
   */
  public getFileMetadata(
    params: ({ hashes: string[] } | { file_ids: number[] }) & {
      only_return_identifiers?: boolean;
      detailed_url_information?: boolean;
      hide_service_names_tags?: boolean;
      include_notes?: boolean;
    },
  ): Observable<{ metadata: HydrusFileFromAPI[] }> {
    let newParams;
    if ('hashes' in params) {
      //this.logger.debug(`getFileMetadata ${params.hashes}`);
      newParams = {
        ...params,
        hashes: JSON.stringify(params.hashes),
      };
    } else {
      //this.logger.debug(`getFileMetadata ${params.file_ids}`);
      newParams = {
        ...params,
        file_ids: JSON.stringify(params.file_ids),
      };
    }
    return this.apiGet<{ metadata: HydrusFileFromAPI[] }>(
      'get_files/file_metadata',
      newParams,
    ).pipe(map((resp) => resp.data));
  }

  /**
   * Generates a file's URL from its Hash
   * @param file_hash the hash of the file to get
   * @return the URL of the raw full file referenced by the hash
   */
  public getFileURLFromHash(file_hash: string): string {
    return (
      this.apiUrl +
      'get_files/file?hash=' +
      file_hash +
      '&Hydrus-Client-API-Access-Key=' +
      this.hydrusApiKey
    );
  }

  /**
   * Generates a file's thumbnail URL from its hash
   * @param file_hash the hash of the file to get a thumbnail of
   * @return the URL of the thumbnail for the file referenced by the hash
   */
  public getThumbnailURLFromHash(file_hash: string): string {
    return (
      this.apiUrl +
      'get_files/thumbnail?hash=' +
      file_hash +
      '&Hydrus-Client-API-Access-Key=' +
      this.hydrusApiKey
    );
  }

  public getThumbnailStream(hash: string, headers?) {
    return this.http.get<IncomingMessage>(this.apiUrl + 'get_files/thumbnail', {
      params: { hash },
      headers: { ...headers, ...this.headers },
      responseType: 'stream',
    });
  }

  public getFileStream(hash: string, headers?) {
    return this.http.get<IncomingMessage>(this.apiUrl + 'get_files/file', {
      params: { hash },
      headers: { ...headers, ...this.headers },
      responseType: 'stream',
    });
  }
}
