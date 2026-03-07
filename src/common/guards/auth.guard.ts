import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Request } from 'express';
import * as jwt from 'jsonwebtoken';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);

  constructor(private readonly prismaService: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request & { user?: any }>();

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      this.logger.warn(
        `Authorization header missing or invalid (ip=${req.ip})`,
      );
      throw new UnauthorizedException('Пожалуйста, авторизуйтесь');
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET!);

      if (typeof decoded !== 'object' || !decoded || !('sub' in decoded)) {
        this.logger.warn(`Invalid JWT payload structure (ip=${req.ip})`);
        throw new UnauthorizedException('Пожалуйста, авторизуйтесь');
      }

      const userId = Number(decoded.sub);

      if (!userId || Number.isNaN(userId)) {
        this.logger.warn(`Invalid userId in JWT (ip=${req.ip})`);
        throw new UnauthorizedException('Пожалуйста, авторизуйтесь');
      }

      const user = await this.prismaService.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          role: true,
          isActive: true,
        },
      });

      if (!user) {
        this.logger.warn(
          `User from token not found (userId=${userId}, ip=${req.ip})`,
        );
        throw new UnauthorizedException('Пожалуйста, авторизуйтесь');
      }

      if (!user.isActive) {
        this.logger.warn(
          `Deactivated user access attempt (userId=${userId}, ip=${req.ip})`,
        );
        throw new ForbiddenException('Пользователь деактивирован');
      }

      req.user = {
        sub: user.id,
        role: user.role,
      };

      return true;
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }

      this.logger.warn(`JWT validation failed (ip=${req.ip})`);

      throw new UnauthorizedException('Пожалуйста, авторизуйтесь');
    }
  }
}
