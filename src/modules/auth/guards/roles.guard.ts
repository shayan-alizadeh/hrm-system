import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator.js'; // پسوند .js معمولاً در تایپ‌اسکریپت نیاز نیست
import { RoleType } from '../../../../generated/prisma/enums.js'; // ایمپورت صحیح بر اساس آپدیت دیتابیس

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext) {
    
    const requiredRoles = this.reflector.getAllAndOverride<RoleType[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) return true;

    const { user } = context.switchToHttp().getRequest();

    // این چک امنیتی بسیار خوب است، هرچند اگر JwtAuthGuard قبل از این گارد اجرا شود،
    // user همیشه برای روت‌های غیر پابلیک وجود خواهد داشت.
    if (!user)
      throw new ForbiddenException('برای دسترسی به این روت باید وارد شوید');

    const hasRole = requiredRoles.includes(user.role);

    if (!hasRole)
      throw new ForbiddenException(
        `شما دسترسی به این روت را ندارید. نقش‌های مجاز: ${requiredRoles.join(', ')}`,
      );

    return true;
  }
}
