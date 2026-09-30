import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsString, Max, Min, ValidateIf } from 'class-validator';

import { IsJalaliDate } from '../../../common/validators/is-jalali-date.validator.js';

/**
 * فیلتر گزارش حضور و غیاب.
 *
 * در مسیر کارمند، مالک گزارش از توکن تعیین می‌شود.
 * userId فقط در سرویس گزارش مدیر به‌عنوان فیلتر استفاده می‌شود.
 */
export class FilterAttendanceDto {
  @ApiPropertyOptional({
    description: 'شناسه کاربر برای فیلتر گزارش در پنل مدیریت',
    example: 5,
    type: Number,
    minimum: 1,
    maximum: 2_147_483_647,
    nullable: false,
  })
  @ValidateIf((_object: unknown, value: unknown) => value !== undefined)
  @Type(() => Number)
  @IsInt({
    message: 'شناسه کاربر باید یک عدد صحیح باشد.',
  })
  @Min(1, {
    message: 'شناسه کاربر باید بزرگ‌تر از صفر باشد.',
  })
  @Max(2_147_483_647, {
    message: 'شناسه کاربر خارج از محدوده مجاز است.',
  })
  userId?: number;

  @ApiPropertyOptional({
    description: 'تاریخ شمسی شروع بازه، شامل خود این روز',
    example: '1404/09/01',
    minLength: 10,
    maxLength: 10,
    nullable: false,
  })
  @ValidateIf((_object: unknown, value: unknown) => value !== undefined)
  @IsString({
    message: 'تاریخ شروع باید یک رشته متنی باشد.',
  })
  @IsJalaliDate({
    message: 'تاریخ شروع باید یک تاریخ شمسی معتبر با قالب YYYY/MM/DD باشد.',
  })
  startDate?: string;

  @ApiPropertyOptional({
    description: 'تاریخ شمسی پایان بازه، شامل خود این روز',
    example: '1404/09/30',
    minLength: 10,
    maxLength: 10,
    nullable: false,
  })
  @ValidateIf((_object: unknown, value: unknown) => value !== undefined)
  @IsString({
    message: 'تاریخ پایان باید یک رشته متنی باشد.',
  })
  @IsJalaliDate({
    message: 'تاریخ پایان باید یک تاریخ شمسی معتبر با قالب YYYY/MM/DD باشد.',
  })
  endDate?: string;
}
