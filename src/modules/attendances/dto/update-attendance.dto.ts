import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

/**
 * قالب صریح زمان با ثانیه و timezone.
 * دقت اعشار، در صورت ارسال، حداکثر میلی‌ثانیه است.
 */
const TIMESTAMP_WITH_TIMEZONE =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/;

/**
 * اصلاح جزئی رکورد حضور و غیاب.
 *
 * نبود فیلد به معنی حفظ مقدار قبلی است.
 * پاک‌کردن ساعت‌ها با null در قرارداد فعلی پشتیبانی نمی‌شود.
 * ترتیب نهایی ورود و خروج با مقادیر دیتابیس در سرویس بررسی می‌شود.
 */
export class UpdateAttendanceDto {
  @ApiPropertyOptional({
    description: 'زمان ورود به میلادی؛ ISO 8601 با ثانیه و منطقه زمانی صریح',
    example: '2026-09-30T08:00:00+03:30',
    type: String,
    format: 'date-time',
    nullable: false,
  })
  @IsOptional()
  @IsString({
    message: 'زمان ورود باید یک رشته متنی باشد.',
  })
  @IsDateString(
    { strict: true, strictSeparator: true },
    { message: 'تاریخ و زمان ورود معتبر نیست.' },
  )
  @Matches(TIMESTAMP_WITH_TIMEZONE, {
    message:
      'زمان ورود باید شامل تاریخ، ساعت، ثانیه و منطقه زمانی مانند Z یا +03:30 باشد.',
  })
  checkIn?: string;

  @ApiPropertyOptional({
    description: 'زمان خروج به میلادی؛ ISO 8601 با ثانیه و منطقه زمانی صریح',
    example: '2026-09-30T16:00:00+03:30',
    type: String,
    format: 'date-time',
    nullable: false,
  })
  @IsOptional()
  @IsString({
    message: 'زمان خروج باید یک رشته متنی باشد.',
  })
  @IsDateString(
    { strict: true, strictSeparator: true },
    { message: 'تاریخ و زمان خروج معتبر نیست.' },
  )
  @Matches(TIMESTAMP_WITH_TIMEZONE, {
    message:
      'زمان خروج باید شامل تاریخ، ساعت، ثانیه و منطقه زمانی مانند Z یا +03:30 باشد.',
  })
  checkOut?: string;

  /**
   * سرویس، این متن را به یادداشت قبلی اضافه می‌کند.
   * سقف طول مجموع یادداشت‌ها نیز در سرویس کنترل می‌شود.
   */
  @ApiPropertyOptional({
    description: 'یادداشت مدیر برای افزودن به سابقه این رکورد',
    example: 'ساعت خروج بر اساس گزارش تأییدشده اصلاح شد.',
    maxLength: 250,
    nullable: false,
  })
  @IsOptional()
  @IsString({
    message: 'یادداشت مدیر باید یک رشته متنی باشد.',
  })
  @MaxLength(250, {
    message: 'یادداشت مدیر نمی‌تواند بیشتر از ۲۵۰ کاراکتر باشد.',
  })
  notes?: string;
}
