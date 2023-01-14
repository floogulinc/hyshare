// from https://github.com/ladeiko/async-zip-stream

import Packer from 'zip-stream';
import { Readable } from 'stream';

export type AsyncEntry = () => Promise<{
  name: string;
  stream: Readable;
}>;

export function createZipStream(
  entries: AsyncEntry[],
  options?: any | undefined,
): Readable {
  const clonedEntries = entries.map((e) => e);
  const archive = new Packer(options); // see https://www.archiverjs.com/zipstream/ options

  const step = async () => {
    if (clonedEntries.length === 0) {
      archive.finish();
      return;
    }

    const entryFun: AsyncEntry = clonedEntries.shift()!;
    try {
      const entry = await entryFun();
      const source = entry.stream;
      archive.entry(source, { name: entry.name }, (err: Error, entry: any) => {
        if (err) {
          archive.emit('error', err);
          return;
        }
        step();
      });
    } catch (e) {
      archive.emit('error', e);
    }
  };

  step();

  return archive;
}
