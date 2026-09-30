// src/main.ts
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module.js';
import { TransformResponseInterceptor } from './common/interceptors/transform-response.interceptor.js';
import { setupSwagger } from './config/swagger.config.js'; // انتقال منطق Swagger به فایل مجزا

async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // تبدیل صریح به عدد (در صورت عدم وجود تبدیل در validation)
  const port = parseInt(configService.get<string>('PORT', '3000'), 10);
  const appName = configService.get<string>('APP_NAME', 'HR API');

  app.enableShutdownHooks();
  app.setGlobalPrefix('api/v1');

  // رفع باگ بحرانی CORS: استفاده از مقدار پیش‌فرض در صورت نبود متغیر در env
  const corsOriginsString = configService.get<string>('CORS_ORIGINS', '*');
  const corsOrigins =
    corsOriginsString === '*'
      ? '*'
      : corsOriginsString
          .split(',')
          .map((origin) => origin.trim())
          .filter(Boolean);

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true, // تبدیل خودکار تایپ‌ها (مثلا string به number در DTO)
      validationError: { target: false, value: false },
    }),
  );

  app.useGlobalInterceptors(new TransformResponseInterceptor());

  // پیشنهاد: اضافه کردن یک فیلتر یکپارچه برای خطاها
  // app.useGlobalFilters(new GlobalExceptionFilter());

  // راه‌اندازی Swagger از طریق فایل تنظیمات جداگانه
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
  process.exit(1);
});
