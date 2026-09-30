import { plainToInstance } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
  validateSync,
} from 'class-validator';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

/**
 * قرارداد تنظیمات موردنیاز برنامه.
 *
 * مقادیر پیش‌فرض فقط برای تنظیماتی تعریف شده‌اند که نبودشان مجاز است.
 * اطلاعات اتصال و کلیدهای امضا باید از محیط اجرا تأمین شوند.
 */
class EnvironmentVariables {
  @IsEnum(Environment)
  NODE_ENV: Environment = Environment.Development;

  @IsString()
  @IsOptional()
  APP_NAME: string = 'HR API';

  @IsInt()
  @Min(1)
  @Max(65535)
  PORT: number = 3000;

  @IsString()
  @IsNotEmpty()
  CORS_ORIGINS!: string;

  // تنظیمات اتصال دیتابیس

  @IsString()
  @IsNotEmpty()
  DATABASE_HOST!: string;

  @IsInt()
  @Min(1)
  @Max(65535)
  DATABASE_PORT: number = 3306;

  @IsString()
  @IsNotEmpty()
  DATABASE_USER!: string;

  @IsString()
  @IsNotEmpty()
  DATABASE_PASSWORD!: string;

  @IsString()
  @IsNotEmpty()
  DATABASE_NAME!: string;

  @IsInt()
  @Min(1)
  @Max(100)
  DATABASE_CONNECTION_LIMIT: number = 5;

  // تنظیمات احراز هویت

  // حداقل طول، جایگزین تولید تصادفی و نگه‌داری امن کلید نیست.
  @IsString()
  @IsNotEmpty()
  @MinLength(32)
  JWT_ACCESS_SECRET!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(32)
  JWT_REFRESH_SECRET!: string;

  @IsString()
  @IsOptional()
  ACCESS_TOKEN_EXPIRE: string = '15m';

  @IsString()
  @IsOptional()
  REFRESH_TOKEN_EXPIRE: string = '14d';

  @IsString()
  @IsOptional()
  JWT_ISSUER: string = 'hr-api';

  @IsString()
  @IsOptional()
  JWT_AUDIENCE: string = 'hr-api-client';

  // پیش از تبدیل کلاس، مقدار صریح یا پیش‌فرض وابسته به محیط تعیین می‌شود.
  @IsBoolean()
  SWAGGER_ENABLED!: boolean;
}

/**
 * تبدیل صریح مقدار Boolean پیش از تبدیل ضمنی class-transformer.
 *
 * Boolean('false') برابر true است؛ بنابراین تبدیل ضمنی برای این فیلد
 * مناسب نیست. مقدار خالی یا ناشناخته نیز خطای تنظیمات محسوب می‌شود.
 */
function parseBooleanEnvironment(value: unknown, fallback: boolean): boolean {
  if (value === undefined) {
    return fallback;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    switch (value.trim().toLowerCase()) {
      case 'true':
      case '1':
        return true;

      case 'false':
      case '0':
        return false;
    }
  }

  throw new Error(
    'Environment validation failed: ' +
      'SWAGGER_ENABLED must be true, false, 1, or 0.',
  );
}

/**
 * بررسی originهای مجاز برای CORS دارای credentials.
 *
 * هر مقدار باید یک origin صریح مانند https://example.com باشد.
 * مسیر، query، fragment، اطلاعات کاربری و wildcard پذیرفته نمی‌شوند.
 */
function validateCorsOrigins(value: string): void {
  const origins = value.split(',').map((origin) => origin.trim());

  const valid = origins.every((origin) => {
    if (!origin || origin === '*') {
      return false;
    }

    try {
      const url = new URL(origin);

      return (
        (url.protocol === 'http:' || url.protocol === 'https:') &&
        url.origin === origin
      );
    } catch {
      return false;
    }
  });

  if (!valid) {
    throw new Error(
      'Environment validation failed: ' +
        'CORS_ORIGINS must contain comma-separated HTTP(S) origins ' +
        'without paths, trailing slashes, or wildcards.',
    );
  }
}

/**
 * ورودی ConfigModule برای اعتبارسنجی تنظیمات در زمان راه‌اندازی.
 *
 * تنظیمات نامعتبر باید پیش از پذیرش درخواست‌ها باعث توقف برنامه شوند.
 * پیام‌های اعتبارسنجی، مقادیر ورودی یا کلیدهای محرمانه را درج نمی‌کنند.
 */
export function validateEnvironment(
  config: Record<string, unknown>,
): EnvironmentVariables {
  const nodeEnvironment =
    config.NODE_ENV === undefined ? Environment.Development : config.NODE_ENV;

  const validatedConfig = plainToInstance(
    EnvironmentVariables,
    {
      ...config,
      NODE_ENV: nodeEnvironment,

      // نبود متغیر: فعال در development و test، غیرفعال در production.
      // مقدار صریح معتبر، بر این پیش‌فرض اولویت دارد.
      SWAGGER_ENABLED: parseBooleanEnvironment(
        config.SWAGGER_ENABLED,
        nodeEnvironment !== Environment.Production,
      ),
    },
    {
      // Boolean پیش‌تر تبدیل شده است؛ فیلدهای عددی اینجا تبدیل می‌شوند.
      enableImplicitConversion: true,
    },
  );

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
    validationError: {
      target: false,
      value: false,
    },
  });

  if (errors.length > 0) {
    const errorMessages = errors
      .flatMap((error) =>
        Object.values(error.constraints ?? {}).map(
          (message) => `${error.property}: ${message}`,
        ),
      )
      .join('\n');

    throw new Error(`Environment validation failed:\n${errorMessages}`);
  }

  // پس از بررسی نوع رشته، ساختار و سازگاری originها بررسی می‌شود.
  validateCorsOrigins(validatedConfig.CORS_ORIGINS);

  return validatedConfig;
}
