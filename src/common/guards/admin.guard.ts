import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type { Request } from 'express';
import { Role } from 'src/generated/prisma/enums';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request & { user?: any }>();

    if (req.user.role !== Role.ADMIN) {
      throw new ForbiddenException('Доступ запрещен');
    }

    return true;
  }
}
