import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import type { RoleType } from '../../../../generated/prisma/enums.js';
import { ROLES_KEY } from '../decorators/roles.decorator.js';

interface RequestWithAuthenticatedUser {
  user?: {
    id: number;
    role: RoleType;
  };
}

/**
 * مجوز نقش را پس از اجرای JwtAuthGuard بررسی می‌کند.
 *
 * نبود metadata نقش، محدودیت اضافه‌ای اعمال نمی‌کند؛ احراز هویت
 * مسیرهای غیرعمومی همچنان بر عهده JwtAuthGuard است.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // تنظیمات متد بر تنظیمات سطح کنترلر اولویت دارند.
    const requiredRoles = this.reflector.getAllAndOverride<readonly RoleType[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<RequestWithAuthenticatedUser>();

    const user = request.user;

    if (!user) {
      throw new UnauthorizedException(
        'برای دسترسی به این مسیر باید وارد شوید.',
      );
    }

    if (!requiredRoles.includes(user.role)) {
      throw new ForbiddenException('شما مجوز دسترسی به این مسیر را ندارید.');
    }

    return true;
  }
}
