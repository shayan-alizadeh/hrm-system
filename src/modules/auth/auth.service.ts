import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import * as bcrypt from 'bcrypt';
import { RoleType } from '../../../generated/prisma/enums.js';
import { User } from '../../../generated/prisma/client.js';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  // یک هش معتبر bcrypt اما تصادفی که فقط برای اتلاف زمان (Timing) استفاده می‌شود.
  // این هش هرگز با هیچ توکنی مچ نمی‌شود.
  private readonly DUMMY_HASH =
    '$2b$12$R.Hw/VvS6B/P/4g.D.W9xO1z0.bH.7a.k.6/T/S.l.Q.u.Y.O.i';

  constructor(
    private readonly prisma: PrismaService,
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  async register(
    mobile: string,
    password: string,
    firstName: string,
    lastName: string,
    role: RoleType = 'EMPLOYEE',
  ) {
    // کد قبلی register ...
    const alreadyExistMobile = await this.prisma.user.findUnique({
      where: { mobile },
    });

    if (alreadyExistMobile)
      throw new BadRequestException('شماره موبایل از قبل وجود دارد.');

    const passwordHashed = await bcrypt.hash(password, 12);

    const user = await this.prisma.user.create({
      data: { mobile, password: passwordHashed, firstName, lastName, role },
    });

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async validateUser(mobile: string, password: string) {
    // کد قبلی validateUser ...
    const user = await this.prisma.user.findUnique({
      where: { mobile },
    });

    if (!user)
      throw new NotFoundException('کاربری با این شماره موبایل یافت نشد.');

    if (!user.isActive) {
      throw new UnauthorizedException('حساب کاربری شما غیرفعال شده است.');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid)
      throw new UnauthorizedException('پسورد وارد شده صحیح نیست.');

    return user;
  }

  async login(user: User) {
    const payload = { sub: user.id, role: user.role };

    // دسترسی توکن و رفرش توکن
    const accessToken = this.jwtService.sign(payload, {
      secret: this.config.get('JWT_ACCESS_SECRET'),
      expiresIn: this.config.get('ACCESS_TOKEN_EXPIRE') || '15m',
    });

    const refreshToken = this.jwtService.sign(
      { sub: user.id },
      {
        secret: this.config.get('JWT_REFRESH_SECRET'),
        expiresIn: this.config.get('REFRESH_TOKEN_EXPIRE') || '14d',
      },
    );

    const tokenHash = await bcrypt.hash(refreshToken, 12);

    // =========================================================
    // پیاده‌سازی Single Session (محدودیت نشست یگانه)
    // قبل از ذخیره توکن جدید، تمام توکن‌های قبلی این کاربر را باطل می‌کنیم.
    // =========================================================
    await this.prisma.refreshToken.updateMany({
      where: {
        userId: user.id,
        revokedAt: null, // فقط توکن‌های فعال
      },
      data: {
        revokedAt: new Date(),
      },
    });

    // حالا توکن نشست جدید را ذخیره می‌کنیم
    await this.prisma.refreshToken.create({
      data: { tokenHash, userId: user.id },
    });

    const { password: _, ...userWithoutPassword } = user;

    return {
      accessToken,
      refreshToken,
      user: userWithoutPassword,
    };
  }

  async refreshToken(providedRefreshToken: string) {
    let payload: any;
    try {
      payload = this.jwtService.verify(providedRefreshToken, {
        secret: this.config.get('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException(
        'Refresh token نامعتبر یا منقضی شده است.',
      );
    }

    const userId = payload.sub;

    const tokens = await this.prisma.refreshToken.findMany({
      where: {
        userId: userId,
        revokedAt: null,
      },
      include: { user: true },
    });

    let isValidRefreshToken = false;
    let matchedTokenRecord: any = null;

    // =========================================================
    // پیاده‌سازی Dummy Hash برای جلوگیری از Timing Attack
    // =========================================================

    if (tokens.length === 0) {
      // اگر کاربر هیچ نشست فعالی نداشت، یک مقایسه ساختگی انجام می‌دهیم
      // تا زمان پاسخگویی سرور طولانی شود و با حالت موفقیت‌آمیز تفاوتی نکند.
      await bcrypt.compare(providedRefreshToken, this.DUMMY_HASH);
    } else {
      // اگر توکنی بود، مقایسه واقعی را انجام می‌دهیم
      for (const rt of tokens) {
        const match = await bcrypt.compare(providedRefreshToken, rt.tokenHash);
        if (match) {
          isValidRefreshToken = true;
          matchedTokenRecord = rt;
          break; // پیدا کردیم، از حلقه خارج می‌شویم
        }
      }
    }

    if (!isValidRefreshToken || !matchedTokenRecord) {
      throw new UnauthorizedException('توکن شما معتبر نیست');
    }

    if (!matchedTokenRecord.user.isActive) {
      throw new UnauthorizedException('حساب کاربری غیرفعال است.');
    }

    // چرخش توکن (ابطال توکن فعلی و صدور توکن جدید)
    await this.prisma.refreshToken.update({
      where: { id: matchedTokenRecord.id },
      data: { revokedAt: new Date() },
    });

    const user = matchedTokenRecord.user;
    const accessTokenPayload = { sub: user.id, role: user.role };

    const newAccessToken = this.jwtService.sign(accessTokenPayload, {
      secret: this.config.get('JWT_ACCESS_SECRET'),
      expiresIn: this.config.get('ACCESS_TOKEN_EXPIRE') || '15m',
    });

    const newRefreshToken = this.jwtService.sign(
      { sub: user.id },
      {
        secret: this.config.get('JWT_REFRESH_SECRET'),
        expiresIn: this.config.get('REFRESH_TOKEN_EXPIRE') || '14d',
      },
    );

    const tokenHash = await bcrypt.hash(newRefreshToken, 12);

    await this.prisma.refreshToken.create({
      data: {
        tokenHash: tokenHash,
        userId: user.id,
      },
    });

    return {
      newAccessToken,
      newRefreshToken,
    };
  }

  async logout(userId: number) {
    await this.prisma.refreshToken.updateMany({
      where: {
        userId: userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }

  async findUserById(userId: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('کاربر یافت نشد');
    return user;
  }
}
