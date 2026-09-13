import { IsOptional, IsString, Matches } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO برای فیلتر کردن حضور و غیاب
 */
export class FilterAttendanceDto {
  /**
   * زمان شروع (timestamp)
   */
  @ApiPropertyOptional({
    description: 'تاریخ روز شروع',
    example: '1404/09/01',
  })
  @IsString({ message: 'فرمت زمان شروع صحیح نیست' })
  @Matches(/^(13|14)\d{2}\/(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])$/, {
    message:
      'فرمت تاریخ شروع نامعتبر است. فرمت صحیح: yyyy/mm/dd (مثال: 1404/09/26)',
  })
  @IsOptional()
  startTime?: string;

  /**
   * زمان پایان (timestamp)
   */
  @ApiPropertyOptional({
    description: 'تاریخ روز پایان',
    example: '1404/09/31',
  })
  @IsString({ message: 'فرمت زمان پایان صحیح نیست' })
  @Matches(/^(13|14)\d{2}\/(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])$/, {
    message:
      'فرمت تاریخ پایان نامعتبر است. فرمت صحیح: yyyy/mm/dd (مثال: 1404/09/26)',
  })
  @IsOptional()
  endTime?: string;
}
