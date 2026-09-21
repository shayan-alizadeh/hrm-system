import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from '../auth.service.js';
import { ConfigService } from '@nestjs/config';

interface JwtPayload {
  sub: number;
  role: string;
  tv: number; // اضافه شدن tokenVersion به تایپ پی‌لود
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_ACCESS_SECRET'),
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.authService.findUserById(payload.sub);

    if (!user || !user.isActive) {
      throw new UnauthorizedException('حساب کاربری شما غیرفعال شده است.');
    }

    // مقایسه tokenVersion داخل توکن با دیتابیس
    if (user.tokenVersion !== payload.tv) {
      throw new UnauthorizedException(
        'توکن شما نامعتبر شده است. لطفاً دوباره وارد شوید.',
      );
    }

    return { id: user.id, role: user.role };
  }
}
