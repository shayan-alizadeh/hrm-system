import { Transform } from 'class-transformer';
import { IsDefined, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

import { IsJalaliDate } from '../../../common/validators/is-jalali-date.validator.js';

export class CreateHolidayDto {
  @ApiProperty({
    description: 'تاریخ معتبر شمسی با قالب yyyy/mm/dd',
    example: '1404/01/01',
    type: String,
    minLength: 10,
    maxLength: 10,
  })
  @IsDefined({ message: 'تاریخ تعطیلی الزامی است.' })
  @IsString({ message: 'تاریخ باید رشته متنی باشد.' })
  @IsJalaliDate({
    message: 'تاریخ شمسی نامعتبر است؛ نمونه صحیح: 1404/01/01.',
  })
  date!: string;

  @ApiProperty({
    description: 'عنوان مناسبت',
    example: 'عید نوروز',
    minLength: 3,
    maxLength: 100,
  })
  // فاصله‌های ابتدا و انتها پیش از بررسی طول حذف می‌شوند.
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsDefined({ message: 'عنوان مناسبت الزامی است.' })
  @IsString({ message: 'عنوان باید متن باشد.' })
  @MinLength(3, {
    message: 'عنوان نمی‌تواند کمتر از ۳ کاراکتر باشد.',
  })
  @MaxLength(100, {
    message: 'عنوان نمی‌تواند بیشتر از ۱۰۰ کاراکتر باشد.',
  })
  title!: string;
}
