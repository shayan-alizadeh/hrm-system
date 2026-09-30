import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateIf,
} from 'class-validator';

/**
 * ورودی ویرایش جزئی دپارتمان.
 *
 * نبود هر فیلد به معنی حفظ مقدار قبلی است.
 * نام نمی‌تواند null باشد؛ توضیحات با null قابل پاک‌کردن است.
 */
export class UpdateDepartmentDto {
  @ApiPropertyOptional({
    description: 'نام جدید دپارتمان؛ مقدار null یا نام خالی پذیرفته نمی‌شود',
    example: 'منابع انسانی',
    minLength: 1,
    maxLength: 100,
    nullable: false,
  })
  @Transform(
    ({ value }: { value: unknown }) =>
      typeof value === 'string' ? value.trim() : value,
    { toClassOnly: true },
  )
  // فقط نبود فیلد اعتبارسنجی را متوقف می‌کند؛ null باید بررسی و رد شود.
  @ValidateIf((_object: unknown, value: unknown) => value !== undefined)
  @IsString({
    message: 'نام دپارتمان باید یک رشته متنی باشد.',
  })
  @IsNotEmpty({
    message: 'نام دپارتمان نمی‌تواند خالی یا فقط شامل فاصله باشد.',
  })
  @MaxLength(100, {
    message: 'نام دپارتمان نمی‌تواند بیشتر از ۱۰۰ کاراکتر باشد.',
  })
  name?: string;

  @ApiPropertyOptional({
    type: String,
    description: 'توضیحات جدید؛ برای پاک‌کردن مقدار قبلی، null ارسال کنید',
    example: 'مسئول مدیریت امور کارکنان سازمان',
    maxLength: 250,
    nullable: true,
  })
  @IsOptional()
  @IsString({
    message: 'توضیحات باید یک رشته متنی باشد.',
  })
  @MaxLength(250, {
    message: 'توضیحات نمی‌تواند بیشتر از ۲۵۰ کاراکتر باشد.',
  })
  description?: string | null;
}
