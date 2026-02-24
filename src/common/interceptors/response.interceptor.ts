import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((result) => {
        if (
          result &&
          typeof result === 'object' &&
          'message' in result &&
          'data' in result
        ) {
          return {
            success: true,
            message: (result as any).message,
            data: (result as any).data,
          };
        }

        if (result && typeof result === 'object' && 'message' in result) {
          return {
            success: true,
            message: (result as any).message,
          };
        }

        return {
          success: true,
          message: 'OK',
          data: result,
        };
      }),
    );
  }
}
