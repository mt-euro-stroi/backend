import { BadRequestException } from '@nestjs/common';
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
    limits: {
      fileSize: 5 * 1024 * 1024,
    },
    fileFilter: (_, file, cb) => {
      const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];

      if (!allowedMimeTypes.includes(file.mimetype)) {
        return cb(
          new BadRequestException('Only JPG, PNG and WEBP images are allowed'),
          false,
        );
      }

      cb(null, true);
    },
  });
}
