import { NotFoundException } from '@nestjs/common';
import { Response } from 'express';
import { Observable, of, Subject, throwError } from 'rxjs';
import { PassThrough, Writable } from 'stream';
import { pipeline } from 'stream/promises';
import { AppConfig } from '../config';
import { HydrusApiService } from '../hydrus-api/hydrus-api.service';
import { GalleryController } from './gallery.controller';

const settle = () => new Promise<void>((resolve) => setImmediate(resolve));

describe('Gallery ZIP download lifecycle', () => {
  let controller: GalleryController;
  let res: Writable;
  let api: { searchFiles: jest.Mock; getFileStream: jest.Mock };
  const run = () =>
    controller.getGalleryDownload({ tag: 'demo' }, res as unknown as Response);

  beforeEach(() => {
    res = new Writable({ write: (_chunk, _encoding, cb) => cb() });
    api = {
      searchFiles: jest
        .fn()
        .mockReturnValue(of({ hashes: ['ab'.repeat(32), 'cd'.repeat(32)] })),
      getFileStream: jest.fn(),
    };
    controller = new GalleryController(
      api as unknown as HydrusApiService,
      new AppConfig(),
    );
  });

  afterEach(() => res.destroy());

  it('lets the search finish after a disconnect without starting file streams', async () => {
    const search = new Subject<{ hashes: string[] }>();
    api.searchFiles.mockReturnValue(search);
    const done = run();
    res.destroy();
    await settle();
    expect(search.observed).toBe(true);
    expect(api.searchFiles.mock.calls[0]).toHaveLength(2);
    search.next({ hashes: ['ab'.repeat(32)] });
    search.complete();
    await expect(done).resolves.toBeUndefined();
    expect(api.searchFiles).toHaveBeenCalledTimes(1);
    expect(api.getFileStream).not.toHaveBeenCalled();
  });

  it('discards a late entry after disconnect without fetching later files', async () => {
    const pending = new Subject<{
      data: PassThrough;
      headers: Record<string, string>;
    }>();
    api.getFileStream.mockReturnValue(pending);
    const file = await run();
    const result = pipeline(file.getStream(), res).catch((error) => error);
    await settle();
    res.destroy();
    await result;
    expect(pending.observed).toBe(true);
    const source = new PassThrough();
    pending.next({
      data: source,
      headers: { 'content-disposition': 'inline; filename="file.png"' },
    });
    pending.complete();
    await settle();
    expect(source.destroyed).toBe(true);
    expect(api.getFileStream).toHaveBeenCalledTimes(1);
  });

  it('destroys an entry stream if its filename cannot be parsed', async () => {
    const source = new PassThrough();
    api.getFileStream.mockReturnValue(of({ data: source, headers: {} }));
    await expect(controller.filePromise('ab'.repeat(32))).rejects.toThrow();
    expect(source.destroyed).toBe(true);
  });

  it('keeps normal request retries for temporary upstream failures', async () => {
    let attempts = 0;
    const source = new PassThrough();
    api.getFileStream.mockReturnValue(
      new Observable((subscriber) => {
        attempts++;
        if (attempts === 1) {
          subscriber.error(new Error('temporary failure'));
        } else {
          subscriber.next({
            data: source,
            headers: { 'content-disposition': 'inline; filename="file.png"' },
          });
          subscriber.complete();
        }
      }),
    );
    const entry = await controller.filePromise('ab'.repeat(32));
    expect(attempts).toBe(2);
    expect(entry.name).toBe('file.png');
    source.destroy();
  });

  it('preserves empty-gallery errors', async () => {
    api.searchFiles.mockReturnValue(of({ hashes: [] }));
    await expect(run()).rejects.toBeInstanceOf(NotFoundException);
  });

  it('handles an early entry failure with a generic error response', async () => {
    api.getFileStream.mockReturnValue(
      throwError(() => new Error('private upstream details')),
    );
    const file = await run();
    const output = {
      destroyed: false,
      headersSent: false,
      statusCode: 200,
      removeHeader: jest.fn(),
      setHeader: jest.fn(),
      end: jest.fn(),
      destroy: jest.fn(),
    };
    file
      .getStream()
      .once('error', (error) =>
        file.errorHandler(error, output as unknown as Response),
      );
    const result = pipeline(file.getStream(), res).catch((error) => error);
    await result;
    expect(output.statusCode).toBe(500);
    expect(output.end).toHaveBeenCalledWith('Unable to stream download');
  });

  it('closes a partial ZIP response on entry failure', async () => {
    const source = new PassThrough();
    api.getFileStream.mockReturnValue(
      of({
        data: source,
        headers: { 'content-disposition': 'inline; filename="file.png"' },
      }),
    );
    const file = await run();
    const destroy = jest.spyOn(res, 'destroy');
    Object.assign(res, { headersSent: true });
    file
      .getStream()
      .once('error', (error) =>
        file.errorHandler(error, res as unknown as Response),
      );
    const result = pipeline(file.getStream(), res).catch((error) => error);
    await settle();
    source.destroy(new Error('upstream reset'));
    await result;
    expect(destroy).toHaveBeenCalled();
    expect(api.getFileStream).toHaveBeenCalledTimes(1);
  });
});
