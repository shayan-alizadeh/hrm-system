import {
  BadRequestException,
  UnauthorizedException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import * as bcrypt from 'bcrypt';
import { User } from '../../../generated/prisma/client.js';
import { RoleType } from '../../../generated/prisma/enums.js';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  // برای جلوگیری از Enumeration در متد لاگین
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
    const user = await this.prisma.user.findUnique({ where: { mobile } });
    const isPasswordValid = await bcrypt.compare(
      password,
      user ? user.password : this.DUMMY_HASH,
    );

    if (!user || !isPasswordValid)
      throw new UnauthorizedException('شماره موبایل یا رمز عبور اشتباه است.');
    if (!user.isActive)
      throw new UnauthorizedException('حساب کاربری شما غیرفعال شده است.');

    return user;
  }

  // اضافه شدن منطق صدور توکن‌ها (برای تمیزی کد، آن را به یک متد جداگانه بردیم)
  private async issueTokens(
    userId: number,
    role: string,
    tokenVersion: number,
  ) {
    // مرحله اول: ساخت رکورد موقت در دیتابیس برای گرفتن ID (که همان jti است)
    const rtRecord = await this.prisma.refreshToken.create({
      data: { tokenHash: 'temp', userId: userId },
    });

    const jti = rtRecord.id; // استفاده از شناسه رکورد به عنوان JWT ID

    // تولید Access Token (با tv)
    const accessToken = this.jwtService.sign(
      { sub: userId, role: role, tv: tokenVersion },
      {
        secret: this.config.get('JWT_ACCESS_SECRET'),
        expiresIn: this.config.get('ACCESS_TOKEN_EXPIRE') || '15m',
      },
    );

    // تولید Refresh Token (با jti و tv)
    const refreshToken = this.jwtService.sign(
      { sub: userId, tv: tokenVersion, jti: jti },
      {
        secret: this.config.get('JWT_REFRESH_SECRET'),
        expiresIn: this.config.get('REFRESH_TOKEN_EXPIRE') || '14d',
      },
    );

    // مرحله دوم: هش کردن رفرش توکن نهایی و آپدیت رکورد دیتابیس
    const tokenHash = await bcrypt.hash(refreshToken, 12);
    await this.prisma.refreshToken.update({
      where: { id: jti },
      data: { tokenHash },
    });

    return { accessToken, refreshToken };
  }

  async login(user: User) {
    // باطل کردن توکن‌های قبلی (Single Session)
    await this.prisma.refreshToken.updateMany({
      where: { userId: user.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    // استفاده از متد جدید برای صدور توکن‌ها
    const tokens = await this.issueTokens(
      user.id,
      user.role,
      user.tokenVersion,
    );

    const { password: _, ...userWithoutPassword } = user;
    return { ...tokens, user: userWithoutPassword };
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

    const { sub: userId, jti, tv } = payload;

    // ۱. پیدا کردن مستقیم رکورد توکن با استفاده از jti (دیگر نیازی به حلقه for نیست)
    const rtRecord = await this.prisma.refreshToken.findUnique({
      where: { id: jti },
      include: { user: true },
    });

    if (!rtRecord) {
      throw new UnauthorizedException('توکن در سیستم یافت نشد.');
    }

    // ۲. بررسی منطبق بودن tokenVersion کاربر با توکن
    if (rtRecord.user.tokenVersion !== tv) {
      throw new UnauthorizedException(
        'این نشست نامعتبر است (احتمالاً رمز عبور تغییر کرده است).',
      );
    }

    // ۳. تشخیص استفاده مجدد از توکن (Token Reuse Detection)
    // اگر توکن قبلاً باطل شده بود (اما کسی دارد سعی می‌کند از آن استفاده کند)
    if (rtRecord.revokedAt !== null) {
      // این یک حمله امنیتی است. باید تمام توکن‌های کاربر باطل شود.
      await this.prisma.refreshToken.updateMany({
        where: { userId: userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      // و بهتر است tokenVersion کاربر را نیز افزایش دهیم تا اکسس‌توکن‌ها هم از کار بیفتند
      await this.prisma.user.update({
        where: { id: userId },
        data: { tokenVersion: { increment: 1 } },
      });
      throw new UnauthorizedException(
        'استفاده غیرمجاز تشخیص داده شد. شما از سیستم خارج شدید.',
      );
    }

    // ۴. مقایسه هش واقعی
    const isMatch = await bcrypt.compare(
      providedRefreshToken,
      rtRecord.tokenHash,
    );
    if (!isMatch) {
      throw new UnauthorizedException('توکن دستکاری شده است.');
    }

    if (!rtRecord.user.isActive) {
      throw new UnauthorizedException('حساب کاربری غیرفعال است.');
    }

    // ۵. ابطال توکن فعلی
    await this.prisma.refreshToken.update({
      where: { id: jti },
      data: { revokedAt: new Date() },
    });

    // ۶. صدور توکن‌های جدید
    return this.issueTokens(
      userId,
      rtRecord.user.role,
      rtRecord.user.tokenVersion,
    );
  }

  // متدی که هنگام تغییر رمز عبور فراخوانی می‌شود
  async revokeAllUserTokens(userId: number) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { tokenVersion: { increment: 1 } }, // افزایش نسخه باعث ابطال تمام اکسس‌توکن‌ها می‌شود
    });

    await this.prisma.refreshToken.updateMany({
      where: { userId: userId, revokedAt: null },
      data: { revokedAt: new Date() }, // باطل کردن رفرش‌توکن‌ها
    });
  }

  async logout(userId: number) {
    await this.prisma.refreshToken.updateMany({
      where: { userId: userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async findUserById(userId: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('کاربر یافت نشد');
    return user;
  }
}
