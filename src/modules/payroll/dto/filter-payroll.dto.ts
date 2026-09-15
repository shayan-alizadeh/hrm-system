import { IsOptional, IsInt, IsString, Matches, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO برای فیلتر کردن حقوق و دستمزد
 */
export class FilterPayrollDto {
  /**
   * شناسه کاربر (برای مدیران)
   */
  @ApiPropertyOptional({
    description: 'شناسه کاربر (فقط برای مدیران)',
    example: 1,
  })
  @Type(() => Number)
  @IsInt({ message: 'شناسه کاربر باید یک عدد صحیح باشد' })
  @Min(1, { message: 'شناسه کاربر باید بزرگتر از صفر باشد' })
  @IsOptional()
  userId?: number;

  /**
   * دوره (ماه و سال)
   */
  @ApiPropertyOptional({
    description: 'دوره حقوق (فرمت: YYYY-MM)',
    example: '1404/08',
  })
  @IsString({ message: 'دوره باید یک رشته متنی باشد' })
  @Matches(/^\d{4}\/\d{2}$/, {
    message: 'فرمت دوره صحیح نیست. باید به صورت YYYY-MM باشد (مثلاً 1404/01)',
  })
  @IsOptional()
  salaryPeriod?: string;

  /**
   * وضعیت پرداخت
   */
  @ApiPropertyOptional({
    description: 'وضعیت پرداخت',
    example: 'paid',
    enum: ['pending', 'paid'],
  })
  @IsOptional()
  status?: 'pending' | 'paid';
}
