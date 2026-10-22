import { Logger, StreamableFile } from '@nestjs/common';
import { ExpressAdapter } from '@nestjs/platform-express';
import { mkdtemp, mkdir, writeFile, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { EventEmitter } from 'events';
import { Request, Response } from 'express';
import { of, Subject, throwError } from 'rxjs';
import { PassThrough, Writable } from 'stream';
import { AppController } from './app.controller';
import { AppConfig, EnvConfig } from './config';
import { HydrusApiService } from './hydrus-api/hydrus-api.service';

const settle = () => new Promise<void>((resolve) => setImmediate(resolve));

class DownloadResponse extends Writable {
  statusCode = 200;
  headersSent = false;
  headers: Record<string, string> = {};
  chunks: Buffer[] = [];

  status(code: number) {
    this.statusCode = code;
    return this;
  }
  header(headers: Record<string, string>) {
    for (const [name, value] of Object.entries(headers)) {
      this.setHeader(name, value);
    }
    return this;
  }
  setHeader(name: string, value: string) {
    this.headers[name.toLowerCase()] = value;
    return this;
  }
  getHeader(name: string) {
    return this.headers[name.toLowerCase()];
  }
  removeHeader(name: string) {
    delete this.headers[name.toLowerCase()];
  }
  _write(chunk: Buffer, _encoding: string, callback: () => void) {
    this.headersSent = true;
    this.chunks.push(Buffer.from(chunk));
    callback();
  }
}

describe.each([
  ['getFile', 'getFileStream'],
  ['getThumbnail', 'getThumbnailStream'],
] as const)('%s stream lifecycle', (method, fetchMethod) => {
  let controller: AppController;
  let req: Request;
  let res: DownloadResponse;
  let fetch: jest.Mock;
  let source: PassThrough;
  const response = () => ({
    status: 206,
    headers: { 'content-type': 'video/mp4', 'content-range': 'bytes 0-3/100' },
    data: source,
  });
  const run = () =>
    controller[method](
      { hash: 'ab'.repeat(32) },
      req,
      res as unknown as Response,
    );
  const reply = (body: StreamableFile) => {
    const done = new Promise<void>((resolve) => {
      res.once('finish', resolve);
      res.once('close', resolve);
    });
    new ExpressAdapter().reply(res, body);
    return done;
  };
  const serve = async () => {
    const body = await run();
    if (body) {
      expect(body).toBeInstanceOf(StreamableFile);
      await reply(body);
    }
  };

  beforeEach(() => {
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    req = Object.assign(new EventEmitter(), {
      headers: {},
      destroyed: false,
      complete: true,
    }) as Request;
    res = new DownloadResponse();
    source = new PassThrough();
    fetch = jest.fn().mockImplementation(() => of(response()));
    controller = new AppController(
      { [fetchMethod]: fetch } as unknown as HydrusApiService,
      new EnvConfig(),
      new AppConfig(),
    );
  });

  afterEach(() => {
    source.destroy();
    res.destroy();
    jest.restoreAllMocks();
  });

  it('streams through Nest even when the incoming request has already completed', async () => {
    Object.assign(req, { destroyed: true, complete: true });
    const done = serve();
    await settle();
    // A completed incoming GET is not a disconnected download.
    req.emit('close');
    source.end('data');
    await done;
    expect(Buffer.concat(res.chunks).toString()).toBe('data');
    expect(res.statusCode).toBe(206);
    expect(res.headers['content-range']).toBe('bytes 0-3/100');
    expect(res.headers['cache-control']).toContain('public, max-age=');
  });

  it.each([false, true])(
    'handles an upstream stream error (partial body: %s)',
    async (partial) => {
      const done = serve();
      await settle();
      if (partial) source.write('data');
      source.destroy(new Error('upstream connection reset'));
      await expect(done).resolves.toBeUndefined();
      await settle();
      expect(res.destroyed || res.writableFinished).toBe(true);
      if (!partial) {
        expect(res.statusCode).toBe(500);
        expect(res.headers['cache-control']).toBe('no-store');
      }
      expect(Logger.prototype.error).toHaveBeenCalledWith(
        'upstream connection reset',
        expect.any(String),
      );
    },
  );

  it('destroys the upstream stream when the client disconnects mid-transfer', async () => {
    const done = serve();
    await settle();
    source.write('data');
    res.destroy();
    await done;
    expect(source.destroyed).toBe(true);
  });

  it('discards a late response after the client disconnects', async () => {
    const pending = new Subject<ReturnType<typeof response>>();
    fetch.mockReturnValue(pending);
    const done = run();
    res.destroy();
    expect(pending.observed).toBe(true);
    pending.next(response());
    pending.complete();
    await done;
    expect(source.destroyed).toBe(true);
    expect(res.headers).toEqual({});
  });

  it('ignores a late upstream failure after the client disconnects', async () => {
    const pending = new Subject<ReturnType<typeof response>>();
    fetch.mockReturnValue(pending);
    const done = run();
    res.destroy();
    pending.error(new Error('upstream failed after disconnect'));
    await expect(done).resolves.toBeUndefined();
    expect(res.headers).toEqual({});
  });

  it('keeps HTTP errors from Hydrus as HTTP exceptions before streaming', async () => {
    fetch.mockReturnValue(
      throwError(() => ({
        response: { status: 404, statusText: 'Not Found' },
      })),
    );
    await expect(run()).rejects.toMatchObject({ status: 404 });
    expect(res.headers).toEqual({});
  });

  it('keeps transport errors on the normal Nest exception path', async () => {
    const error = new Error('TLS handshake failed');
    fetch.mockReturnValue(throwError(() => error));
    await expect(run()).rejects.toBe(error);
  });

  if (method === 'getThumbnail') {
    it('returns a StreamableFile for thumbnails on disk', async () => {
      const directory = await mkdtemp(join(tmpdir(), 'hyshare-thumbnails-'));
      try {
        await mkdir(join(directory, 'tab'));
        await writeFile(
          join(directory, 'tab', `${'ab'.repeat(32)}.thumbnail`),
          'local thumbnail',
        );
        controller = new AppController(
          { [fetchMethod]: fetch } as unknown as HydrusApiService,
          Object.assign(new EnvConfig(), { HYSHARE_THUMBNAIL_DIR: directory }),
          new AppConfig(),
        );
        const file = await run();
        expect(file).toBeInstanceOf(StreamableFile);
        expect(file.getHeaders().length).toBe(15);
        await reply(file);
        expect(Buffer.concat(res.chunks).toString()).toBe('local thumbnail');
        expect(fetch).not.toHaveBeenCalled();
      } finally {
        await rm(directory, { recursive: true, force: true });
      }
    });
  }

  it('does not fetch for an already disconnected response', async () => {
    res.destroy();
    await run();
    expect(fetch).not.toHaveBeenCalled();
  });
});
