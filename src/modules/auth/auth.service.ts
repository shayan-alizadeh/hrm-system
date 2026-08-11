import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
  Injectable,
} from '@nestjs/common';
import { roleType } from 'generated/prisma/enums';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { users } from 'generated/prisma/browser';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  async register(
    mobile: string,
    password: string,
    role: roleType = roleType.EMPLOYEE,
  ) {
    const alreadyExistMobile = await this.prisma.users.findUnique({
      where: { mobile },
    });

    if (alreadyExistMobile)
      throw new BadRequestException('شماره موبایل از قبل وجود دارد .');

    const passwordHashed = await bcrypt.hash(password, 12);

    const user = await this.prisma.users.create({
      data: { mobile, password: passwordHashed, role },
    });

    return user;
  }
  async validateUser(mobile: string, password: string) {
    const user = await this.prisma.users.findUnique({
      where: {
        mobile,
      },
    });
    if (!user)
      throw new NotFoundException('کاربری با این شماره موبایل یافت نشد');

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid)
      throw new UnauthorizedException('پسورد وارد شده صحیح نیست');

    return user;
  }

  async login(user: users) {
    const payload = { sub: user.id, role: user.role };

    //Access token
    const accessToken = this.jwtService.sign(
      { payload },
      {
        secret: this.config.get('JWT_ACCESS_SECRET'),
        expiresIn: this.config.get('ACCESS_TOKEN_EXPIRE') || '15m',
      },
    );

    //Refresh token
    const refreshToken = this.jwtService.sign(
      { sub: user.id },
      {
        secret: this.config.get('JWT_REFRESH_SECRET'),
        expiresIn: this.config.get('REFRESH_TOKEN_EXPIRE') || '14d',
      },
    );

    const tokenHash = await bcrypt.hash(refreshToken, 12);
    const rt = this.prisma.refresh_tokens.create({
      data: { tokenHash, userId: user.id },
    });

    return {
      accessToken,
      refreshToken,
      user,
    };
  }

  async refreshToken(providedRefreshToken: string) {
    let payload: any;
    try {
      payload = this.jwtService.verify(providedRefreshToken, {
        secret: this.config.get('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token!');
    }

    const userId = payload.sub;

    // ۱. دریافت توکن‌های فعال کاربر همراه با اطلاعات خود کاربر
    const tokens = await this.prisma.refresh_tokens.findMany({
      where: {
        userId: userId,
        revokedAt: null, // فقط توکن‌هایی که باطل نشده‌اند
      },
      include: {
        user: true,
      },
    });

    let isValidRefreshToken = false;

    for (const rt of tokens) {
      const match = await bcrypt.compare(providedRefreshToken, rt.tokenHash);

      if (match) {
        isValidRefreshToken = true;

        // ۲. باطل کردن توکن فعلی (تنظیم revokedAt)
        await this.prisma.refresh_tokens.update({
          where: { id: rt.id },
          data: { revokedAt: new Date() },
        });

        const user = rt.user;
        const accessTokenPayload = { sub: user.id, role: user.role };

        // Access token
        const newAccessToken = this.jwtService.sign(accessTokenPayload, {
          secret: this.config.get('JWT_ACCESS_SECRET'),
          expiresIn: this.config.get('ACCESS_TOKEN_EXPIRE') || '15m',
        });

        // Refresh token
        const newRefreshToken = this.jwtService.sign(
          { sub: user.id },
          {
            secret: this.config.get('JWT_REFRESH_SECRET'),
            expiresIn: this.config.get('REFRESH_TOKEN_EXPIRE') || '14d',
          },
        );

        // ۳. هش و ذخیره توکن جدید در دیتابیس
        const tokenHash = await bcrypt.hash(newRefreshToken, 12);
        await this.prisma.refresh_tokens.create({
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
    }

    if (!isValidRefreshToken) {
      throw new BadRequestException('توکن شما معتبر نیست');
    }
  }
  async logout(userId: number) {
    await this.prisma.refresh_tokens.updateMany({
      where: {
        userId: userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }
}
