import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import type { RoleType } from '../../../../generated/prisma/enums.js';
import { AuthService } from '../auth.service.js';

interface AccessTokenPayload {
  sub: number;
  tv: number;
  exp: number;
  tokenType: 'access';
}

interface AuthenticatedUser {
  id: number;
  role: RoleType;
}

/**
 * ساختار claims موردنیاز برنامه را در زمان اجرا بررسی می‌کند.
 * اعتبار امضا، issuer، audience و زمان انقضا توسط Passport بررسی می‌شود.
 */
function isAccessTokenPayload(payload: unknown): payload is AccessTokenPayload {
  if (
    typeof payload !== 'object' ||
    payload === null ||
    Array.isArray(payload)
  ) {
    return false;
  }

  const claims = payload as Record<string, unknown>;

  return (
    typeof claims.sub === 'number' &&
    Number.isSafeInteger(claims.sub) &&
    claims.sub > 0 &&
    typeof claims.tv === 'number' &&
    Number.isSafeInteger(claims.tv) &&
    claims.tv >= 0 &&
    typeof claims.exp === 'number' &&
    Number.isSafeInteger(claims.exp) &&
    claims.exp > 0 &&
    claims.tokenType === 'access'
  );
}

/**
 * احراز هویت درخواست با access token و وضعیت فعلی کاربر در دیتابیس.
 *
 * نقش داخل JWT مرجع مجوزدهی نیست؛ نقش فعلی دیتابیس استفاده می‌شود
 * تا تغییر دسترسی کاربر در درخواست بعدی اعمال شود.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly authService: AuthService,
    configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
      algorithms: ['HS256'],
      issuer: configService.getOrThrow<string>('JWT_ISSUER'),
      audience: configService.getOrThrow<string>('JWT_AUDIENCE'),
    });
  }

  async validate(payload: unknown): Promise<AuthenticatedUser> {
    if (!isAccessTokenPayload(payload)) {
      throw new UnauthorizedException('ساختار اکسس توکن معتبر نیست.');
    }

    // در AuthService اصلاح‌شده، کاربر ناموجود یا غیرفعال رد می‌شود.
    const user = await this.authService.findUserById(payload.sub);

    // افزایش نسخه نشست، توکن‌های صادرشده با نسخه قبلی را نامعتبر می‌کند.
    if (user.tokenVersion !== payload.tv) {
      throw new UnauthorizedException(
        'نشست شما نامعتبر شده است؛ دوباره وارد شوید.',
      );
    }

    // فقط اطلاعات موردنیاز کنترلرها و گارد نقش به request.user منتقل می‌شود.
    return {
      id: user.id,
      role: user.role,
    };
  }
}
