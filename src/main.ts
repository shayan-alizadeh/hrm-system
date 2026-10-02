import { Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module.js';
import { TransformResponseInterceptor } from './common/interceptors/transform-response.interceptor.js';
import { setupSwagger } from './config/swagger.config.js';

async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // تبدیل نوع، اعتبارسنجی و مقادیر پیش‌فرض در validateEnvironment اعمال می‌شوند.
  const port = configService.getOrThrow<number>('PORT');
  const appName = configService.getOrThrow<string>('APP_NAME');

  // امکان اجرای lifecycle hookهای پاک‌سازی هنگام دریافت سیگنال توقف.
  app.enableShutdownHooks();

  // تنظیم Prefix و فعال‌سازی سیستم Versioning خودکار NestJS
  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // اعتبار originها پیش از راه‌اندازی برنامه بررسی شده است.
  // با فعال بودن credentials، استفاده از wildcard مجاز نیست.
  const corsOrigins = configService
    .getOrThrow<string>('CORS_ORIGINS')
    .split(',')
    .map((origin) => origin.trim());

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      // فیلدهای فاقد decorator اعتبارسنجی در DTO پذیرفته نمی‌شوند.
      whitelist: true,
      forbidNonWhitelisted: true,

      // ساخت instance از DTO؛ تبدیل فیلدهای داخلی باید در DTO تعریف شود.
      transform: true,

      // جلوگیری از بازگرداندن شیء ورودی و مقدار فیلد در جزئیات خطا.
      validationError: {
        target: false,
        value: false,
      },
    }),
  );


  // تصمیم درباره فعال بودن Swagger در تابع تنظیمات آن گرفته می‌شود.
  setupSwagger(app, configService);

  await app.listen(port);
  logger.log(`${appName} started on port ${port}`);
}

bootstrap().catch((error: unknown) => {
  const logger = new Logger('Bootstrap');

  if (error instanceof Error) {
    logger.error(`Application bootstrap failed: ${error.message}`, error.stack);
  } else {
    logger.error('Application bootstrap failed', String(error));
  }

  // شکست راه‌اندازی باید برای مدیر فرایند یا کانتینر قابل تشخیص باشد.
  process.exit(1);
});
