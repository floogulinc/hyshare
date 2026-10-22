import { HttpService } from '@nestjs/axios';
import { of } from 'rxjs';
import { EnvConfig } from '../config';
import { HydrusApiService } from './hydrus-api.service';

describe('HydrusApiService stream request headers', () => {
  let service: HydrusApiService;
  let get: jest.Mock;

  beforeEach(() => {
    get = jest.fn().mockReturnValue(of({}));
    service = new HydrusApiService(
      {
        HYSHARE_HYDRUS_API_URL: 'https://hydrus.example/',
        HYSHARE_HYDRUS_API_KEY: 'server-api-key',
      } as EnvConfig,
      { get } as unknown as HttpService,
    );
  });

  it.each(['getFileStream', 'getThumbnailStream'] as const)(
    '%s forwards only Range alongside the server API key',
    (method) => {
      const clientHeaders = {
        host: 'localhost:3000',
        authorization: 'Bearer browser-credential',
        cookie: 'session=browser-session',
        'hydrus-client-api-access-key': 'client-supplied-key',
        'content-length': '20',
        'transfer-encoding': 'chunked',
        connection: 'keep-alive',
        'accept-encoding': 'gzip',
        'x-forwarded-for': '192.0.2.1',
        range: 'bytes=100-200',
        'if-range': '"file-version"',
        'if-none-match': '"thumbnail-version"',
        'if-modified-since': 'Wed, 21 Oct 2026 07:28:00 GMT',
      };

      service[method]('a'.repeat(64), clientHeaders);

      expect(get.mock.calls[0][1]).toEqual({
        params: { hash: 'a'.repeat(64) },
        headers: {
          'Hydrus-Client-API-Access-Key': 'server-api-key',
          range: clientHeaders.range,
        },
        responseType: 'stream',
      });
      expect(clientHeaders.host).toBe('localhost:3000');
    },
  );

  it.each(['getFileStream', 'getThumbnailStream'] as const)(
    '%s supports requests without client headers, including ZIP downloads',
    (method) => {
      service[method]('a'.repeat(64));

      expect(get.mock.calls[0][1].headers).toEqual({
        'Hydrus-Client-API-Access-Key': 'server-api-key',
      });
    },
  );
});
