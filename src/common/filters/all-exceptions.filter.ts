import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const response =
      exception instanceof HttpException ? exception.getResponse() : null;

    const rawMessage =
      typeof response === 'object' && response && 'message' in response
        ? (response as any).message
        : exception instanceof Error
          ? exception.message
          : 'Internal server error';

    const message = Array.isArray(rawMessage) ? rawMessage[0] : rawMessage;

    res.status(status).json({
      success: false,
      statusCode: status,
      message,
    });
  }
}
