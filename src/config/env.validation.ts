// src/config/env.validation.ts
import { plainToInstance, Transform } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsString,
  IsBoolean,
  Max,
  Min,
  validateSync,
  IsOptional,
  IsNotEmpty,
} from 'class-validator';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

class EnvironmentVariables {
  @IsEnum(Environment)
  @IsOptional()
  NODE_ENV: Environment = Environment.Development;

  @IsString()
  @IsOptional()
  APP_NAME: string = 'HR API';

  @IsNumber()
  @Min(1)
  @Max(65535)
  @IsOptional()
  PORT: number = 3001;

  @IsString()
  @IsNotEmpty()
  CORS_ORIGINS!: string;

  // --- Database Environment Variables ---

  @IsString()
  @IsNotEmpty()
  DATABASE_HOST!: string;

  @IsNumber()
  @Min(1)
  @Max(65535)
  @IsOptional()
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

  @IsNumber()
  @Min(1)
  @Max(100)
  @IsOptional()
  DATABASE_CONNECTION_LIMIT: number = 5;

  // --- JWT & Auth Environment Variables ---

  @IsString()
  @IsNotEmpty()
  JWT_ACCESS_SECRET!: string;

  @IsString()
  @IsNotEmpty()
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

  // --- Features ---

  @IsBoolean()
  @IsOptional()
  @Transform(({ obj, value }) => {
    // اگر مقدار صراحتاً در env تنظیم شده باشد
    if (value !== undefined && value !== '') {
      return value === 'true' || value === true || value === '1';
    }
    // در غیر این صورت، سوگر فقط در محیط‌های غیر از پروداکشن فعال باشد
    return obj.NODE_ENV !== Environment.Production;
  })
  SWAGGER_ENABLED!: boolean;
}

export function validateEnvironment(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    // استخراج و نمایش تمیز خطاهای ولیدیشن به جای نمایش آبجکت خام
    const errorMessages = errors
      .map((error) => Object.values(error.constraints || {}).join(', '))
      .join('\n');

    throw new Error(`Environment validation failed:\n${errorMessages}`);
  }

  return validatedConfig;
}
