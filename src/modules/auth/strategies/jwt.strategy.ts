import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from '../auth.service.js';
import { ConfigService } from '@nestjs/config';

// تعریف تایپ برای پی‌لود تا از any جلوگیری کنیم
interface JwtPayload {
  sub: number;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false, // حتماً اکسپایر شدن رو چک کن
      secretOrKey: configService.get('JWT_ACCESS_SECRET'),
    });
  }

  async validate(payload: JwtPayload) {
    // پیدا کردن کاربر از دیتابیس
    const user = await this.authService.findUserById(payload.sub);

    // چک امنیتی مهم: اگر حساب کارمند مسدود یا پاک شده بود، دسترسی قطع شود
    if (!user || !user.isActive) {
      throw new UnauthorizedException('حساب کاربری شما غیرفعال شده است.');
    }

    // این آبجکت درون req.user قرار می‌گیرد
    return { id: user.id, role: user.role };
  }
}
