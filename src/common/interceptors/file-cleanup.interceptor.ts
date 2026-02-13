import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, from, throwError } from 'rxjs';
import { catchError, mergeMap } from 'rxjs/operators';
import { removeUploadedFiles } from '../utils/remove-uploaded-files.util';

@Injectable()
export class FileCleanupInterceptor implements NestInterceptor {
  private readonly logger = new Logger(FileCleanupInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError((error) => {
        const request = context.switchToHttp().getRequest();
        const files: Express.Multer.File[] = request.files ?? [];

        if (!files.length) {
          return throwError(() => error);
        }

        const filePaths = files.map((item) => item.path);

        return from(removeUploadedFiles(filePaths)).pipe(
          mergeMap(() => {
            this.logger.warn(
              `Cleaned up ${filePaths.length} file(s) after error`,
            );
            return throwError(() => error);
          }),
        );
      }),
    );
  }
}
