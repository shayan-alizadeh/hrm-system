import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { roleType } from 'generated/prisma/enums';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext) {
    const requiredRoles = this.reflector.getAllAndOverride<roleType[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const { user } = context.switchToHttp().getRequest();

    if (!user)
      throw new ForbiddenException('برای دسترسی به این روت باید وارد شوید');

    const hasRole = requiredRoles.includes(user.role);

    if (!hasRole)
      throw new ForbiddenException(
        `شما دسترسی به این روت را ندارید. نقش های مجاز: ${requiredRoles.join(', ')}`,
      );

    return true;
  }
}
