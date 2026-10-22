import { Readable, PassThrough, Writable } from 'stream';
import { pipeline } from 'stream/promises';
import { createZipStream } from './create-zip-stream';

const settle = () => new Promise<void>((resolve) => setImmediate(resolve));
const sink = () => new Writable({ write: (_chunk, _encoding, cb) => cb() });

describe('ZIP stream lifecycle', () => {
  it('completes all entries and produces a complete ZIP', async () => {
    const chunks: Buffer[] = [];
    const archive = createZipStream(
      [
        async () => ({
          name: 'first.txt',
          stream: Readable.from(['first content']),
        }),
        async () => ({
          name: 'last.txt',
          stream: Readable.from(['last content']),
        }),
      ],
      { store: true },
    );
    await pipeline(
      archive,
      new Writable({
        write: (chunk, _encoding, cb) => {
          chunks.push(Buffer.from(chunk));
          cb();
        },
      }),
    );
    const zip = Buffer.concat(chunks);
    expect(zip.includes(Buffer.from('first content'))).toBe(true);
    expect(zip.includes(Buffer.from('last content'))).toBe(true);
    expect(zip.readUInt32LE(zip.length - 22)).toBe(0x06054b50);
    expect(zip.readUInt16LE(zip.length - 12)).toBe(2);
  });

  it('destroys the active source when the consumer disconnects', async () => {
    const source = new PassThrough();
    const next = jest.fn();
    const archive = createZipStream([
      async () => ({ name: 'first.txt', stream: source }),
      next,
    ]);
    const destination = sink();
    const result = pipeline(archive, destination).catch((error) => error);
    await settle();
    source.write('partial content');
    destination.destroy();
    await result;
    expect(source.destroyed).toBe(true);
    expect(next).not.toHaveBeenCalled();
  });

  it('destroys a source returned after cancellation', async () => {
    let resolveEntry: (entry: { name: string; stream: Readable }) => void;
    const source = new PassThrough();
    const next = jest.fn();
    const archive = createZipStream([
      () =>
        new Promise((resolve) => {
          resolveEntry = resolve;
        }),
      next,
    ]);
    const result = pipeline(archive, sink()).catch((error) => error);
    await settle();
    archive.destroy();
    await result;
    resolveEntry({ name: 'late.txt', stream: source });
    await settle();
    expect(source.destroyed).toBe(true);
    expect(next).not.toHaveBeenCalled();
  });

  it('propagates a pending entry failure and stops the archive', async () => {
    const error = new Error('Hydrus is unavailable');
    const next = jest.fn();
    const archive = createZipStream([
      async () => {
        throw error;
      },
      next,
    ]);
    await expect(pipeline(archive, sink())).rejects.toBe(error);
    expect(next).not.toHaveBeenCalled();
  });

  it('propagates a source error during an entry and stops the archive', async () => {
    const source = new PassThrough();
    const next = jest.fn();
    const error = new Error('Hydrus disconnected during download');
    const archive = createZipStream([
      async () => ({ name: 'first.txt', stream: source }),
      next,
    ]);
    const result = pipeline(archive, sink()).catch((error) => error);
    await settle();
    source.destroy(error);
    expect(await result).toBe(error);
    expect(next).not.toHaveBeenCalled();
  });

  it('does not fetch entries when the archive was already destroyed', async () => {
    const entry = jest.fn();
    const archive = createZipStream([entry]);
    const result = pipeline(archive, sink()).catch(() => undefined);
    archive.destroy();
    await result;
    await settle();
    expect(entry).not.toHaveBeenCalled();
  });

  it('propagates source errors even when the consumer is backpressured', async () => {
    const source = new PassThrough();
    const next = jest.fn();
    const archive = createZipStream(
      [async () => ({ name: 'file.bin', stream: source }), next],
      { store: true, highWaterMark: 1 },
    );
    const destination = new Writable({
      highWaterMark: 1,
      // Keep the first write pending to simulate a stalled download.
      write: () => undefined,
    });
    const result = pipeline(archive, destination).catch((error) => error);
    await settle();
    source.write(Buffer.alloc(65536));
    await settle();
    const error = new Error('upstream failed while output was stalled');
    source.destroy(error);
    expect(await result).toBe(error);
    expect(destination.destroyed).toBe(true);
    expect(next).not.toHaveBeenCalled();
  });
});
