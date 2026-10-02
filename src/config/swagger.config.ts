import type { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { OpenAPIObject } from '@nestjs/swagger';

import { AppModule } from '../app.module.js';

type SwaggerScope = 'manager' | 'employee';

/**
 * فقط مسیرهای مربوط به نقش انتخاب‌شده و مسیرهای مشترک را نگه می‌دارد.
 *
 * سند ورودی تغییر نمی‌کند. components حفظ می‌شود تا ارجاع‌های $ref
 * موجود در مسیرهای باقی‌مانده معتبر بمانند.
 *
 * این فیلتر صرفاً نمایش مستندات را محدود می‌کند؛ کنترل دسترسی API
 * باید توسط guardها انجام شود.
 */
function filterSwaggerDocument(
  document: OpenAPIObject,
  scope: SwaggerScope,
): OpenAPIObject {
  // به دلیل استفاده از URI Versioning، مسیرها در swagger با /v1 (بدون /api) ثبت می‌شوند
  const allowedPrefixes = [`/v1/${scope}`, '/v1/auth', '/v1/uploads'];

  const paths: OpenAPIObject['paths'] = {};

  for (const [path, pathItem] of Object.entries(document.paths)) {
    // بررسی مرز مسیر مانع تطبیق manager با مسیرهایی مانند manager-extra است.
    const isAllowed = allowedPrefixes.some(
      (prefix) => path === prefix || path.startsWith(`${prefix}/`),
    );

    if (isAllowed) {
      paths[path] = pathItem;
    }
  }

  return {
    ...document,
    paths,
  };
}

/**
 * هر سند builder مستقل دارد تا تغییر metadata یک نقش
 * روی عنوان، توضیحات یا تنظیمات سند نقش دیگر اثر نگذارد.
 */
function createSwaggerConfig(
  title: string,
  description: string,
): Omit<OpenAPIObject, 'paths'> {
  return new DocumentBuilder()
    .setTitle(title)
    .setDescription(description)
    .setVersion('1.0')
    .addBearerAuth()
    .build();
}

/**
 * مستندات Manager و Employee را در مسیرهای جدا ثبت می‌کند.
 *
 * مقدار SWAGGER_ENABLED توسط validateEnvironment به Boolean تبدیل شده است.
 * پیشوند مسیرها با app.setGlobalPrefix('api') در main.ts هماهنگ است.
 */
export function setupSwagger(
  app: INestApplication,
  configService: ConfigService,
): void {
  const swaggerEnabled = configService.getOrThrow<boolean>('SWAGGER_ENABLED');

  if (!swaggerEnabled) {
    return;
  }

  const managerConfig = createSwaggerConfig(
    'HR API - Manager',
    'API endpoints available to users with the manager role.',
  );

  const employeeConfig = createSwaggerConfig(
    'HR API - Employee',
    'API endpoints available to users with the employee role.',
  );

  // کنترلرهای ماژول‌های واردشده به AppModule نیز بررسی می‌شوند.
  const documentOptions = {
    include: [AppModule],
    deepScanRoutes: true,
  };

  const managerDocument = filterSwaggerDocument(
    SwaggerModule.createDocument(app, managerConfig, documentOptions),
    'manager',
  );

  const employeeDocument = filterSwaggerDocument(
    SwaggerModule.createDocument(app, employeeConfig, documentOptions),
    'employee',
  );

  // مسیرهای دسترسی به مستندات با ساختار جدید /api/v1 همگام شدند
  SwaggerModule.setup('api/v1/manager/docs', app, () => managerDocument);
  SwaggerModule.setup('api/v1/employee/docs', app, () => employeeDocument);
}
