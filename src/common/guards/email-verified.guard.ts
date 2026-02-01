import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";

@Injectable()
export class EmailVerifiedGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request & { user?: any }>();
    const user = req.user;

    if (!user?.isEmailVerified) {
      throw new ForbiddenException('Email is not verified');
    }

    return true;
  }
}
