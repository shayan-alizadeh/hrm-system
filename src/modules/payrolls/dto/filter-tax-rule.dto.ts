import { Transform } from 'class-transformer';
import { IsInt, Max, Min, ValidateIf } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class FilterTaxRuleDto {
  @ApiPropertyOptional({
    description: 'سال شمسی قوانین مالیاتی',
    example: 1404,
    minimum: 1300,
    maximum: 1499,
    type: Number,
  })
  @Transform(({ value }: { value: unknown }) => {
    // ورودی نامعتبر حفظ می‌شود تا اعتبارسنجی آن را رد کند.
    if (typeof value === 'string' && /^\d{4}$/.test(value)) {
      return Number(value);
    }

    return value;
  })
  // اصلاح نوع _object به unknown برای جلوگیری از خطای Implicit Any تایپ‌اسکریپت
  @ValidateIf((_object: unknown, value: unknown) => value !== undefined)
  @IsInt({ message: 'سال باید یک عدد صحیح باشد.' })
  @Min(1300, { message: 'سال نمی‌تواند کمتر از ۱۳۰۰ باشد.' })
  @Max(1499, { message: 'سال نمی‌تواند بیشتر از ۱۴۹۹ باشد.' })
  year?: number;
}
