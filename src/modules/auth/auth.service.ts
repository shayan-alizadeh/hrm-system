import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  OnModuleInit,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import {
  createHash,
  randomBytes,
  randomUUID,
  timingSafeEqual,
} from 'node:crypto';

import { Prisma } from '../../../generated/prisma/client.js';
import type { User } from '../../../generated/prisma/client.js';
import type { RoleType } from '../../../generated/prisma/enums.js';
import { PrismaService } from '../../prisma/prisma.service.js';

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

interface RefreshPayload {
  sub: number;
  tv: number;
  jti: string;
  tokenType: 'refresh';
  exp: number;
}

type PublicUser = Omit<User, 'password'>;

type LoginResult = TokenPair & {
  user: PublicUser;
};

const PASSWORD_COST = 12;
const MAX_TRANSACTION_ATTEMPTS = 3;

@Injectable()
export class AuthService implements OnModuleInit {
  private dummyHash!: string;

  private readonly accessSecret: string;
  private readonly refreshSecret: string;
  private readonly accessTokenLifetime: number;
  private readonly refreshTokenLifetime: number;
  private readonly issuer: string;
  private readonly audience: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    config: ConfigService,
  ) {
    this.accessSecret = config.getOrThrow<string>('JWT_ACCESS_SECRET');

    this.refreshSecret = config.getOrThrow<string>('JWT_REFRESH_SECRET');

    this.issuer = config.getOrThrow<string>('JWT_ISSUER');
    this.audience = config.getOrThrow<string>('JWT_AUDIENCE');

    this.accessTokenLifetime = this.parseLifetime(
      config.getOrThrow<string>('ACCESS_TOKEN_EXPIRE'),
      'ACCESS_TOKEN_EXPIRE',
    );

    this.refreshTokenLifetime = this.parseLifetime(
      config.getOrThrow<string>('REFRESH_TOKEN_EXPIRE'),
      'REFRESH_TOKEN_EXPIRE',
    );
  }

  /**
   * یک هش معتبر با هزینه مشابه رمز کاربران تولید می‌شود.
   * در ورود ناموفق کاربر ناموجود نیز عملیات bcrypt انجام خواهد شد؛
   * این کار تمام تفاوت‌های زمانی درخواست را حذف نمی‌کند.
   */
  async onModuleInit(): Promise<void> {
    this.dummyHash = await bcrypt.hash(
      randomBytes(32).toString('hex'),
      PASSWORD_COST,
    );
  }

  /**
   * زمان انقضا به ثانیه تبدیل می‌شود تا مقدار عددی معتبر به JWT برسد.
   * فرمت‌های پذیرفته‌شده: عدد صحیح مثبت با s، m، h، d یا w.
   */
  private parseLifetime(value: string, name: string): number {
    const match = /^([1-9]\d*)(s|m|h|d|w)$/.exec(value.trim());

    if (!match) {
      throw new Error(
        `${name} must be a positive duration such as 15m or 14d.`,
      );
    }

    const units: Record<string, number> = {
      s: 1,
      m: 60,
      h: 3_600,
      d: 86_400,
      w: 604_800,
    };

    const amount = Number(match[1]);
    const multiplier = units[match[2] ?? ''];

    if (multiplier === undefined) {
      throw new Error(`${name} contains an unsupported time unit.`);
    }

    const seconds = amount * multiplier;

    if (
      !Number.isSafeInteger(seconds) ||
      seconds <= 0 ||
      !Number.isSafeInteger(Math.floor(Date.now() / 1_000) + seconds)
    ) {
      throw new Error(`${name} is outside the supported range.`);
    }

    return seconds;
  }

  private toPublicUser(user: User): PublicUser {
    const { password: _password, ...publicUser } = user;
    return publicUser;
  }

  /**
   * bcrypt ورودی را پس از ۷۲ بایت قطع می‌کند.
   * محدودیت برحسب بایت UTF-8 است، نه تعداد کاراکتر.
   */
  private isSupportedPassword(password: unknown): password is string {
    return (
      typeof password === 'string' &&
      password.length > 0 &&
      Buffer.byteLength(password, 'utf8') <= 72
    );
  }

  async register(
    mobile: string,
    password: string,
    firstName: string,
    lastName: string,
    role: RoleType = 'EMPLOYEE',
  ): Promise<PublicUser> {
    if (role !== 'EMPLOYEE') {
      throw new ForbiddenException(
        'ثبت‌نام عمومی فقط برای نقش کارمند مجاز است.',
      );
    }

    if (!this.isSupportedPassword(password)) {
      throw new BadRequestException(
        'رمز عبور باید غیرخالی و حداکثر ۷۲ بایت باشد.',
      );
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { mobile },
      select: { id: true },
    });

    if (existingUser) {
      throw new BadRequestException('شماره موبایل از قبل وجود دارد.');
    }

    const passwordHash = await bcrypt.hash(password, PASSWORD_COST);

    try {
      const user = await this.prisma.user.create({
        data: {
          mobile,
          password: passwordHash,
          firstName,
          lastName,
          role: 'EMPLOYEE',
        },
      });

      return this.toPublicUser(user);
    } catch (error: unknown) {
      // بررسی اولیه کافی نیست؛ درخواست دیگری ممکن است زودتر ثبت شود.
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new BadRequestException(
          'کاربری با اطلاعات یکتای واردشده از قبل وجود دارد.',
        );
      }

      throw error;
    }
  }

  async validateUser(mobile: string, password: string): Promise<User> {
    if (!this.isSupportedPassword(password)) {
      throw new UnauthorizedException('شماره موبایل یا رمز عبور اشتباه است.');
    }

    const user = await this.prisma.user.findUnique({
      where: { mobile },
    });

    const passwordMatches = await bcrypt.compare(
      password,
      user?.password ?? this.dummyHash,
    );

    if (!user || !passwordMatches) {
      throw new UnauthorizedException('شماره موبایل یا رمز عبور اشتباه است.');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('حساب کاربری شما غیرفعال شده است.');
    }

    return user;
  }

  /**
   * توکن تصادفی و امضاشده برخلاف رمز انسانی به هش کند نیاز ندارد.
   * خروجی base64url از SHA-256 برابر ۴۳ کاراکتر است و کل توکن را پوشش می‌دهد.
   */
  private hashRefreshToken(token: string): string {
    return createHash('sha256').update(token, 'utf8').digest('base64url');
  }

  private matchesRefreshToken(token: string, storedHash: string): boolean {
    const actual = Buffer.from(this.hashRefreshToken(token), 'utf8');
    const expected = Buffer.from(storedHash, 'utf8');

    return (
      actual.length === expected.length && timingSafeEqual(actual, expected)
    );
  }

  /**
   * فقط از کلاینت تراکنش استفاده می‌کند؛ صدور رکورد جدید همراه
   * با ابطال رکورد قبلی commit یا rollback می‌شود.
   */
  private async issueTokens(
    tx: Prisma.TransactionClient,
    user: Pick<User, 'id' | 'role' | 'tokenVersion'>,
  ): Promise<TokenPair> {
    const jti = randomUUID();

    const accessToken = this.jwtService.sign(
      {
        sub: user.id,
        role: user.role,
        tv: user.tokenVersion,
        tokenType: 'access',
      },
      {
        secret: this.accessSecret,
        algorithm: 'HS256',
        issuer: this.issuer,
        audience: this.audience,
        expiresIn: this.accessTokenLifetime,
      },
    );

    const refreshToken = this.jwtService.sign(
      {
        sub: user.id,
        tv: user.tokenVersion,
        jti,
        tokenType: 'refresh',
      },
      {
        secret: this.refreshSecret,
        algorithm: 'HS256',
        issuer: this.issuer,
        audience: this.audience,
        expiresIn: this.refreshTokenLifetime,
      },
    );

    await tx.refreshToken.create({
      data: {
        id: jti,
        tokenHash: this.hashRefreshToken(refreshToken),
        userId: user.id,
      },
    });

    return { accessToken, refreshToken };
  }

  /**
   * تعارض نوشتن و deadlock فقط به تعداد محدود تکرار می‌شوند.
   * callback نباید اثر خارجی مانند ارسال پیام یا ایمیل داشته باشد.
   */
  private async runTransaction<T>(
    operation: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    for (let attempt = 0; attempt < MAX_TRANSACTION_ATTEMPTS; attempt += 1) {
      try {
        return await this.prisma.$transaction(operation, {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        });
      } catch (error: unknown) {
        const retryable =
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2034';

        if (!retryable) {
          throw error;
        }

        if (attempt === MAX_TRANSACTION_ATTEMPTS - 1) {
          throw new ServiceUnavailableException(
            'عملیات هم‌زمان در حال انجام است؛ دوباره تلاش کنید.',
          );
        }
      }
    }

    throw new ServiceUnavailableException('عملیات موقتاً قابل انجام نیست.');
  }

  async login(authenticatedUser: User): Promise<LoginResult> {
    return this.runTransaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: authenticatedUser.id },
      });

      // تغییر رمز، ابطال نشست یا غیرفعال‌شدن بین بررسی رمز و صدور توکن
      // نباید با استفاده از snapshot قبلی نادیده گرفته شود.
      if (
        !user ||
        !user.isActive ||
        user.password !== authenticatedUser.password ||
        user.tokenVersion !== authenticatedUser.tokenVersion
      ) {
        throw new UnauthorizedException(
          'وضعیت حساب تغییر کرده است؛ دوباره وارد شوید.',
        );
      }

      await tx.refreshToken.updateMany({
        where: {
          userId: user.id,
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
        },
      });

      const tokens = await this.issueTokens(tx, user);

      return {
        ...tokens,
        user: this.toPublicUser(user),
      };
    });
  }

  /**
   * امضا و claims استاندارد پیش از دسترسی به دیتابیس بررسی می‌شوند.
   * generic تایپ‌اسکریپت جایگزین بررسی ساختار payload در runtime نیست.
   */
  private verifyRefreshToken(token: string): RefreshPayload {
    try {
      if (typeof token !== 'string' || token.length === 0) {
        throw new Error('Missing refresh token.');
      }

      const payload: unknown = this.jwtService.verify(token, {
        secret: this.refreshSecret,
        algorithms: ['HS256'],
        issuer: this.issuer,
        audience: this.audience,
      });

      if (
        typeof payload !== 'object' ||
        payload === null ||
        Array.isArray(payload)
      ) {
        throw new Error('Invalid token payload.');
      }

      const claims = payload as Record<string, unknown>;

      if (
        typeof claims.sub !== 'number' ||
        !Number.isSafeInteger(claims.sub) ||
        claims.sub <= 0 ||
        typeof claims.tv !== 'number' ||
        !Number.isSafeInteger(claims.tv) ||
        claims.tv < 0 ||
        typeof claims.jti !== 'string' ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
          claims.jti,
        ) ||
        claims.tokenType !== 'refresh' ||
        typeof claims.exp !== 'number' ||
        !Number.isSafeInteger(claims.exp)
      ) {
        throw new Error('Invalid refresh token claims.');
      }

      return {
        sub: claims.sub,
        tv: claims.tv,
        jti: claims.jti,
        tokenType: 'refresh',
        exp: claims.exp,
      };
    } catch {
      throw new UnauthorizedException(
        'Refresh token نامعتبر یا منقضی شده است.',
      );
    }
  }

  async refreshToken(providedRefreshToken: string): Promise<TokenPair> {
    const payload = this.verifyRefreshToken(providedRefreshToken);

    const tokens = await this.runTransaction<TokenPair | null>(async (tx) => {
      // ترتیب دسترسی user سپس token در عملیات نشست یکسان نگه داشته می‌شود.
      const user = await tx.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user || !user.isActive || user.tokenVersion !== payload.tv) {
        throw new UnauthorizedException('نشست کاربری معتبر نیست.');
      }

      const record = await tx.refreshToken.findUnique({
        where: { id: payload.jti },
      });

      if (
        !record ||
        record.userId !== user.id ||
        !this.matchesRefreshToken(providedRefreshToken, record.tokenHash)
      ) {
        throw new UnauthorizedException('Refresh token معتبر نیست.');
      }

      if (record.revokedAt !== null) {
        await this.revokeUserSessions(tx, user.id);

        // خطا بیرون تراکنش پرتاب می‌شود تا ابطال نشست‌ها rollback نشود.
        return null;
      }

      // مصرف توکن شرطی است؛ فقط رکوردی که هنوز فعال است تغییر می‌کند.
      const consumed = await tx.refreshToken.updateMany({
        where: {
          id: record.id,
          userId: user.id,
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
        },
      });

      if (consumed.count !== 1) {
        await this.revokeUserSessions(tx, user.id);
        return null;
      }

      return this.issueTokens(tx, user);
    });

    if (tokens === null) {
      throw new UnauthorizedException(
        'استفاده مجدد از رفرش توکن تشخیص داده شد؛ دوباره وارد شوید.',
      );
    }

    return tokens;
  }

  /**
   * افزایش نسخه نشست و ابطال refresh tokenها باید اتمیک باشند.
   * اثر tokenVersion بر access token وابسته به بررسی آن در JwtStrategy است.
   */
  private async revokeUserSessions(
    tx: Prisma.TransactionClient,
    userId: number,
  ): Promise<void> {
    const updated = await tx.user.updateMany({
      where: { id: userId },
      data: {
        tokenVersion: { increment: 1 },
      },
    });

    if (updated.count !== 1) {
      throw new UnauthorizedException('کاربر یافت نشد.');
    }

    await tx.refreshToken.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }

  async revokeAllUserTokens(userId: number): Promise<void> {
    await this.runTransaction((tx) => this.revokeUserSessions(tx, userId));
  }

  async logout(userId: number): Promise<void> {
    await this.revokeAllUserTokens(userId);
  }

  async findUserById(userId: number): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('کاربر یافت نشد یا حساب غیرفعال است.');
    }

    return user;
  }
}
