import { unlink } from 'fs/promises';
import { join } from 'path';

export async function removeUploadedFiles(files: string[]): Promise<void> {
  if (!files?.length) return;

  const results = await Promise.allSettled(
    files.map((item) => {
      const fullPath = item.startsWith('uploads')
        ? item
        : join('uploads', item);

      return unlink(fullPath);
    }),
  );

  const failed = results.filter((r) => r.status === 'rejected');

  if (failed.length > 0) {
    console.error(
      `File cleanup: ${failed.length}/${files.length} files failed to delete`,
    );
  }
}
