// from https://github.com/ladeiko/async-zip-stream

import Packer, { ZipStreamOptions } from 'zip-stream';
import { Readable } from 'stream';

export type AsyncEntry = () => Promise<{
  name: string;
  stream: Readable;
}>;

export function createZipStream(
  entries: AsyncEntry[],
  options?: ZipStreamOptions,
): Readable {
  const archive = new Packer(options); // see https://www.archiverjs.com/zipstream/ options
  let source: Readable | undefined;
  const cleanup = () => {
    source?.destroy();
    source = undefined;
  };
  archive.once('close', cleanup);
  archive.once('error', cleanup);

  const appendEntries = async () => {
    try {
      for (const getEntry of entries) {
        if (archive.destroyed) {
          return;
        }
        const entry = await getEntry();
        source = entry.stream;
        if (archive.destroyed) {
          source.destroy();
          return;
        }
        await new Promise<void>((resolve, reject) => {
          entry.stream.once('error', reject);
          archive.entry(entry.stream, { name: entry.name }, (error) => {
            entry.stream.removeListener('error', reject);
            if (error) reject(error);
            else resolve();
          });
        });
        source = undefined;
      }
      if (!archive.destroyed) {
        archive.finalize();
      }
    } catch (e) {
      if (!archive.destroyed) {
        archive.destroy(e);
      }
    }
  };

  // Let the caller attach its pipeline/error handler before starting entries.
  setImmediate(() => void appendEntries());

  return archive;
}
