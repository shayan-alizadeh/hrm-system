import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

import { IsJalaliDate } from '../../../common/validators/is-jalali-date.validator.js';

/**
 * ورودی ثبت ورود یا خروج.
 * نبود تاریخ باعث استفاده از تاریخ روز تهران در سرویس می‌شود.
 */
export class CheckInOutDto {
  @ApiPropertyOptional({
    description: 'یادداشت اختیاری برای ورود یا خروج',
    example: 'ورود با تأخیر به دلیل ترافیک',
    maxLength: 250,
    nullable: false,
  })
  @IsOptional()
  @IsString({
    message: 'یادداشت باید یک رشته متنی باشد.',
  })
  @MaxLength(250, {
    message: 'یادداشت نمی‌تواند بیشتر از ۲۵۰ کاراکتر باشد.',
  })
  notes?: string;

  @ApiPropertyOptional({
    description:
      'تاریخ شمسی روز کاری با ارقام انگلیسی؛ در صورت حذف، تاریخ روز تهران استفاده می‌شود',
    example: '1404/09/26',
    minLength: 10,
    maxLength: 10,
    nullable: false,
  })
  @IsOptional()
  @IsString({
    message: 'تاریخ باید یک رشته متنی باشد.',
  })
  @IsJalaliDate({
    message: 'تاریخ روز کاری باید یک تاریخ شمسی معتبر با قالب YYYY/MM/DD باشد.',
  })
  attendanceDate?: string;
}
