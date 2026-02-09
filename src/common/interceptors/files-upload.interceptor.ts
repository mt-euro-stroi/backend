import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

export function FilesUploadInterceptor(destination: string, maxFiles = 10) {
  return FilesInterceptor('files', maxFiles, {
    storage: diskStorage({
      destination,
      filename: (_, file, cb) => {
        const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, uniqueName + extname(file.originalname));
      },
    }),
  });
}
