import {
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateHolidayDto {
  @ApiProperty({
    description: 'تاریخ تعطیلی (فرمت: YYYY/MM/DD)',
    example: '1404/01/01',
  })
  @IsString({ message: 'تاریخ باید یک رشته متنی باشد' })
  @Matches(/^(13|14)\d{2}\/(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])$/, {
    message: 'فرمت تاریخ صحیح نیست (مثال: 1404/01/01)',
  })
  @IsNotEmpty({ message: 'تاریخ الزامی است' })
  date!: string;

  @ApiProperty({
    description: 'عنوان مناسبت',
    example: 'عید باستانی نوروز',
  })
  @IsString({ message: 'عنوان باید متن باشد' })
  @MinLength(3, { message: 'عنوان نمی‌تواند کمتر از ۳ کاراکتر باشد' })
  @MaxLength(100, { message: 'عنوان نمی‌تواند بیشتر از ۱۰۰ کاراکتر باشد' })
  @IsNotEmpty({ message: 'عنوان مناسبت الزامی است' })
  title!: string;
}
