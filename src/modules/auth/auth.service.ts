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
  // این هش هرگز با هیچ رمز عبوری تطابق پیدا نمی‌کند و فقط برای ایجاد تاخیر زمانی (Timing) استفاده می‌شود.
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
    const user = await this.prisma.user.findUnique({
      where: { mobile },
    });

    // =========================================================
    // جلوگیری از User Enumeration در زمان لاگین
    // =========================================================
    // مهم: همیشه compare را اجرا می‌کنیم تا زمان پاسخگویی لو نرود
    const isPasswordValid = await bcrypt.compare(
      password,
      user ? user.password : this.DUMMY_HASH,
    );

    // پیام خطا عمداً مبهم است تا مشخص نشود مشکل از موبایل بوده یا رمز عبور
    if (!user || !isPasswordValid) {
      throw new UnauthorizedException('شماره موبایل یا رمز عبور اشتباه است.');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('حساب کاربری شما غیرفعال شده است.');
    }

    return user;
  }

  async login(user: User) {
    const payload = { sub: user.id, role: user.role };

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

    // پیاده‌سازی Single Session
    await this.prisma.refreshToken.updateMany({
      where: {
        userId: user.id,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

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
    // جلوگیری از Session Enumeration
    // =========================================================
    if (tokens.length === 0) {
      await bcrypt.compare(providedRefreshToken, this.DUMMY_HASH);
    } else {
      for (const rt of tokens) {
        const match = await bcrypt.compare(providedRefreshToken, rt.tokenHash);
        if (match) {
          isValidRefreshToken = true;
          matchedTokenRecord = rt;
          break;
        }
      }
    }

    if (!isValidRefreshToken || !matchedTokenRecord) {
      throw new UnauthorizedException('توکن شما معتبر نیست.');
    }

    if (!matchedTokenRecord.user.isActive) {
      throw new UnauthorizedException('حساب کاربری غیرفعال است.');
    }

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
    if (!user) throw new UnauthorizedException('کاربر یافت نشد');
    return user;
  }
}
