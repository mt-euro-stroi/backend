import { unlink } from 'fs/promises';
import { join } from 'path';

export async function removeUploadedFiles(files: string[]) {
  if (!files.length) return;

  await Promise.all(
    files.map((file) => unlink(join('uploads', file)).catch(() => null)),
  );
}
