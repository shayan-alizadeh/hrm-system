import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

import { PrismaClient } from '../../generated/prisma/client.js';

/**
 * کلاینت مشترک دیتابیس با مدیریت اتصال توسط چرخه حیات Nest.
 *
 * تنظیمات اتصال پیش از ساخت سرویس در validateEnvironment
 * اعتبارسنجی و به نوع مناسب تبدیل می‌شوند.
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor(configService: ConfigService) {
    const adapter = new PrismaMariaDb({
      host: configService.getOrThrow<string>('DATABASE_HOST'),
      port: configService.getOrThrow<number>('DATABASE_PORT'),
      user: configService.getOrThrow<string>('DATABASE_USER'),
      password: configService.getOrThrow<string>('DATABASE_PASSWORD'),
      database: configService.getOrThrow<string>('DATABASE_NAME'),
      connectionLimit: configService.getOrThrow<number>(
        'DATABASE_CONNECTION_LIMIT',
      ),

      // مهلت برقراری اتصال برحسب میلی‌ثانیه؛ محدودیت زمان اجرای query نیست.
      connectTimeout: 5_000,
    });

    super({ adapter });
  }

  /**
   * اتصال در زمان راه‌اندازی بررسی می‌شود تا خطای دیتابیس
   * پیش از پذیرش درخواست‌های HTTP مشخص شود.
   */
  async onModuleInit(): Promise<void> {
    try {
      await this.$connect();
      this.logger.log('Successfully connected to the database.');
    } catch (error: unknown) {
      this.logger.error(
        'Failed to connect to the database on startup.',
        error instanceof Error ? error.stack : String(error),
      );

      // خطا باید منتشر شود تا برنامه با اتصال ناموفق راه‌اندازی نشود.
      throw error;
    }
  }

  /**
   * هنگام بسته‌شدن برنامه، منابع اتصال Prisma آزاد می‌شوند.
   * دریافت سیگنال‌های توقف به enableShutdownHooks در bootstrap وابسته است.
   */
  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
    this.logger.log('Database connection closed.');
  }
}
