import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { AxiosRequestHeaders, AxiosRequestConfig, AxiosResponse } from 'axios';
import { map, Observable } from 'rxjs';
import { EnvConfig } from 'src/config';
import { HydrusFileFromAPI } from 'src/hydrus-file';

@Injectable()
export class HydrusApiService {
  constructor(private envConfig: EnvConfig, private http: HttpService) {}

  hydrusApiUrl: string = this.envConfig.HYSHARE_HYDRUS_API_URL;

  hydrusApiKey: string = this.envConfig.HYSHARE_HYDRUS_API_KEY;

  apiUrl = this.hydrusApiUrl + (this.hydrusApiUrl.endsWith('/') ? '' : '/');

  headers: AxiosRequestHeaders = {
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
  public searchFiles<Hashes extends boolean>(
    tags: string[],
    params: {
      file_service_name?: string;
      file_service_key?: string;
      tag_service_name?: string;
      tag_service_key?: string;
      file_sort_type?: number;
      file_sort_asc?: boolean;
      return_hashes?: Hashes;
    } = {},
  ): Hashes extends true
    ? Observable<{ hashes: string[] }>
    : Observable<{ file_ids: number[] }> {
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
   * @param params.hide_service_names_tags true or false (optional, defaulting to false)
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
      newParams = {
        ...params,
        hashes: JSON.stringify(params.hashes),
      };
    } else {
      newParams = {
        ...params,
        file_ids: JSON.stringify(params.file_ids),
      };
    }
    return this.apiGet('get_files/file_metadata', newParams).pipe(
      map((resp) => resp.data),
    );
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

  // public getThumbnailStream(hash: string) {
  //   return this.apiGet(
  //     'get_files/thumbnail',
  //     { hash },
  //     { responseType: 'stream' },
  //   ).pipe(map((resp) => resp.data));
  // }

  public async getThumbnailStream(
    hash: string,
    headers?,
  ): Promise<AxiosResponse> {
    return this.http.axiosRef.get(this.apiUrl + 'get_files/thumbnail', {
      responseType: 'stream',
      params: { hash },
      headers: { ...headers, ...this.headers },
    });
  }

  public async getFileStream(hash: string, headers?): Promise<AxiosResponse> {
    console.log(`file ${hash}`)
    return this.http.axiosRef.get(this.apiUrl + 'get_files/file', {
      responseType: 'stream',
      params: { hash },
      headers: { ...headers, ...this.headers },
    });
  }
}
