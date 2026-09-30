import { IsEnum, IsInt, Max, Min, ValidateIf } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

import { PayrollStatus } from '../../../../generated/prisma/enums.js';

/**
 * فقط نمایش ده‌دهی یک عدد صحیح نامنفی را تبدیل می‌کند.
 * مقدار نامعتبر حفظ می‌شود تا اعتبارسنجی آن را رد کند.
 */
function parseIntegerQuery(value: unknown): unknown {
  if (typeof value === 'string' && /^\d+$/.test(value)) {
    return Number(value);
  }

  return value;
}

export class FilterPayrollDto {
  @ApiPropertyOptional({
    description:
      'شناسه کارمند برای فیلتر مدیر؛ در مسیر کارمند، مالکیت از کاربر احراز هویت‌شده تعیین می‌شود.',
    example: 5,
    type: 'integer',
    minimum: 1,
    maximum: 2_147_483_647,
  })
  @Transform(({ value }: { value: unknown }) => parseIntegerQuery(value))
  @ValidateIf((_object: unknown, value: unknown) => value !== undefined)
  @IsInt({ message: 'شناسه کارمند باید عدد صحیح باشد.' })
  @Min(1, { message: 'شناسه کارمند باید بزرگ‌تر از صفر باشد.' })
  @Max(2_147_483_647, {
    message: 'شناسه کارمند خارج از محدوده مجاز است.',
  })
  userId?: number;

  @ApiPropertyOptional({
    description: 'سال شمسی فیش حقوقی',
    example: 1404,
    type: 'integer',
    minimum: 1300,
    maximum: 1499,
  })
  @Transform(({ value }: { value: unknown }) => parseIntegerQuery(value))
  @ValidateIf((_object: unknown, value: unknown) => value !== undefined)
  @IsInt({ message: 'سال باید عدد صحیح باشد.' })
  @Min(1300, { message: 'سال نمی‌تواند کمتر از ۱۳۰۰ باشد.' })
  @Max(1499, { message: 'سال نمی‌تواند بیشتر از ۱۴۹۹ باشد.' })
  year?: number;

  @ApiPropertyOptional({
    description: 'ماه شمسی فیش حقوقی',
    example: 8,
    type: 'integer',
    minimum: 1,
    maximum: 12,
  })
  @Transform(({ value }: { value: unknown }) => parseIntegerQuery(value))
  @ValidateIf((_object: unknown, value: unknown) => value !== undefined)
  @IsInt({ message: 'ماه باید عدد صحیح باشد.' })
  @Min(1, { message: 'ماه نمی‌تواند کمتر از ۱ باشد.' })
  @Max(12, { message: 'ماه نمی‌تواند بیشتر از ۱۲ باشد.' })
  month?: number;

  @ApiPropertyOptional({
    description: 'وضعیت فیش حقوقی',
    enum: PayrollStatus,
    enumName: 'PayrollStatus',
    example: PayrollStatus.PENDING,
  })
  @ValidateIf((_object: unknown, value: unknown) => value !== undefined)
  @IsEnum(PayrollStatus, {
    message: 'وضعیت باید PENDING یا PAID باشد.',
  })
  status?: PayrollStatus;
}
