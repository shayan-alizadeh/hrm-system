import { createParamDecorator, ExecutionContext } from '@nestjs/common';

import type { RoleType } from '../../../generated/prisma/enums.js';

/**
 * اطلاعاتی که JwtStrategy پس از احراز هویت روی request.user قرار می‌دهد.
 * این قرارداد شامل مدل کامل دیتابیس یا اطلاعات محرمانه کاربر نیست.
 */
export interface CurrentUserData {
  id: number;
  role: RoleType;
}

interface RequestWithCurrentUser {
  user?: CurrentUserData;
}

/**
 * کاربر احرازشده را از درخواست HTTP دریافت می‌کند.
 *
 * این decorator مسئول احراز هویت نیست؛ مسیر محافظت‌شده باید توسط
 * JwtAuthGuard بررسی شود. در مسیر عمومی، خروجی ممکن است undefined باشد.
 */
export const CurrentUser = createParamDecorator<unknown,CurrentUserData | undefined>((_data: unknown, context: ExecutionContext): CurrentUserData | undefined => {
  const request = context.switchToHttp().getRequest<RequestWithCurrentUser>();

  return request.user;
});
