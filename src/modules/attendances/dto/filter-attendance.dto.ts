import { IsOptional, IsString, Matches, IsInt } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class FilterAttendanceDto {
  @ApiPropertyOptional({
    description: 'شناسه کاربر (مخصوص پنل مدیریت برای فیلتر کردن کارمندان)',
    example: 5,
  })
  @IsOptional()
  @Type(() => Number) // تبدیل استرینگِ کوئری‌ارل به عدد
  @IsInt({ message: 'شناسه کاربر باید عدد باشد' })
  userId?: number;

  @ApiPropertyOptional({
    description: 'تاریخ شمسی شروع بازه',
    example: '1404/09/01',
  })
  @IsString({ message: 'فرمت تاریخ شروع صحیح نیست' })
  @Matches(/^(13|14)\d{2}\/(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])$/, {
    message: 'فرمت تاریخ شروع نامعتبر است. فرمت صحیح: yyyy/mm/dd',
  })
  @IsOptional()
  startDate?: string; // تغییر از startTime به startDate

  @ApiPropertyOptional({
    description: 'تاریخ شمسی پایان بازه',
    example: '1404/09/31',
  })
  @IsString({ message: 'فرمت تاریخ پایان صحیح نیست' })
  @Matches(/^(13|14)\d{2}\/(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])$/, {
    message: 'فرمت تاریخ پایان نامعتبر است. فرمت صحیح: yyyy/mm/dd',
  })
  @IsOptional()
  endDate?: string; // تغییر از endTime به endDate
}
