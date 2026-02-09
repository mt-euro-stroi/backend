import { unlink } from 'fs/promises';
import { join } from 'path';

export async function removeUploadedFiles(
  destination: string,
  files: string[],
) {
  if (!files.length) return;

  await Promise.all(
    files.map((file) => unlink(join(destination, file)).catch(() => null)),
  );
}
