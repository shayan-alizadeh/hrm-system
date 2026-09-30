// src/modules/auth/auth.service.ts
import {
  BadRequestException,
  UnauthorizedException,
  Injectable,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto'; // اضافه کردن ماژول استاندارد نود برای تولید jti

import { PrismaService } from '../../prisma/prisma.service.js';
import { User } from '../../../generated/prisma/client.js';
import { RoleType } from '../../../generated/prisma/enums.js';

@Injectable()
export class AuthService {
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

  private async issueTokens(
    userId: number,
    role: string,
    tokenVersion: number,
  ) {
    // ۱. تولید یک شناسه تصادفی مستقل (UUID) بدون وابستگی به اتواینکرمنت دیتابیس
    const jti = crypto.randomUUID();

    const accessToken = this.jwtService.sign(
      { sub: userId, role: role, tv: tokenVersion },
      {
        secret: this.config.get<string>('JWT_ACCESS_SECRET'),
        expiresIn: this.config.get<string>('ACCESS_TOKEN_EXPIRE', '15m'),
      },
    );

    const refreshToken = this.jwtService.sign(
      { sub: userId, tv: tokenVersion, jti: jti },
      {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.config.get<string>('REFRESH_TOKEN_EXPIRE', '14d'),
      },
    );

    // ۲. کاهش Cost به 10 برای جلوگیری از هدر رفت منابع CPU، چون توکن خودش رشته‌ای با آنتروپی بالاست
    const tokenHash = await bcrypt.hash(refreshToken, 10);

    // ۳. اینسرت در یک مرحله (جلوگیری از رکورد موقت و مشکلات Orphaned Record)
    // نکته: برای این کار باید نوع فیلد id در مدل RefreshToken به String (cuid/uuid) تغییر کند.
    // اگر Prisma Schema در دسترس نیست، می‌توانید شناسه توکن را در فیلد مجزایی ذخیره کنید.
    await this.prisma.refreshToken.create({
      data: {
        id: jti, // فرض بر این است که id را در پریزما به String تغییر داده‌اید
        tokenHash,
        userId,
      },
    });

    return { accessToken, refreshToken };
  }

  async login(user: User) {
    // استفاده از Prisma Transaction برای اطمینان از صحت عملیات (ابطال قبلی‌ها و صدور جدید)
    const tokens = await this.prisma.$transaction(async (tx) => {
      await tx.refreshToken.updateMany({
        where: { userId: user.id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      return await this.issueTokens(user.id, user.role, user.tokenVersion);
    });

    const { password: _, ...userWithoutPassword } = user;
    return { ...tokens, user: userWithoutPassword };
  }

  async refreshToken(providedRefreshToken: string) {
    let payload: any;
    try {
      payload = this.jwtService.verify(providedRefreshToken, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException(
        'Refresh token نامعتبر یا منقضی شده است.',
      );
    }

    const { sub: userId, jti, tv } = payload;

    const rtRecord = await this.prisma.refreshToken.findUnique({
      where: { id: jti },
      include: { user: true },
    });

    if (!rtRecord) throw new UnauthorizedException('توکن در سیستم یافت نشد.');
    if (rtRecord.user.tokenVersion !== tv)
      throw new UnauthorizedException(
        'این نشست نامعتبر است (احتمالاً رمز عبور تغییر کرده است).',
      );

    if (rtRecord.revokedAt !== null) {
      await this.prisma.$transaction([
        this.prisma.refreshToken.updateMany({
          where: { userId: userId, revokedAt: null },
          data: { revokedAt: new Date() },
        }),
        this.prisma.user.update({
          where: { id: userId },
          data: { tokenVersion: { increment: 1 } },
        }),
      ]);
      throw new UnauthorizedException(
        'استفاده غیرمجاز تشخیص داده شد. شما از سیستم خارج شدید.',
      );
    }

    const isMatch = await bcrypt.compare(
      providedRefreshToken,
      rtRecord.tokenHash,
    );
    if (!isMatch) throw new UnauthorizedException('توکن دستکاری شده است.');
    if (!rtRecord.user.isActive)
      throw new UnauthorizedException('حساب کاربری غیرفعال است.');

    // ابطال و صدور مجدد درون یک تراکنش
    const tokens = await this.prisma.$transaction(async (tx) => {
      await tx.refreshToken.update({
        where: { id: jti },
        data: { revokedAt: new Date() },
      });
      return await this.issueTokens(
        userId,
        rtRecord.user.role,
        rtRecord.user.tokenVersion,
      );
    });

    return tokens;
  }

  async revokeAllUserTokens(userId: number) {
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { tokenVersion: { increment: 1 } },
      }),
      this.prisma.refreshToken.updateMany({
        where: { userId: userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);
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
