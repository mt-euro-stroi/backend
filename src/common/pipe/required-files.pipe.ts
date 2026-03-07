import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class RequiredFilesPipe implements PipeTransform {
  transform(files: Express.Multer.File[]) {
    if (!files || files.length === 0) {
      throw new BadRequestException('Требуется хотя бы один файл');
    }
    return files;
  }
}
