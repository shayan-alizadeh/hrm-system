import { IsOptional, IsString, Matches } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CheckInOutDto {
  @ApiPropertyOptional({
    description: 'یادداشت اختیاری برای ورود یا خروج',
    example: 'ورود با تاخیر به دلیل ترافیک سنگین',
  })
  @IsString({ message: 'یادداشت باید یک رشته متنی باشد' })
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({
    description: 'تاریخ شمسی روز کاری',
    example: '1404/09/26',
  })
  @IsString({ message: 'تاریخ باید یک رشته متنی باشد' })
  @Matches(/^(13|14)\d{2}\/(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])$/, {
    message: 'فرمت تاریخ نامعتبر است. فرمت صحیح: yyyy/mm/dd (مثال: 1404/09/26)',
  })
  @IsOptional()
  attendanceDate?: string; // تغییر j_date به attendanceDate و استفاده از ?
}
