import {
  IsOptional,
  IsString,
  IsNumber,
  IsEnum,
  Min,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { payrollStatus } from '../../../../generated/prisma/enums.js';

/**
 * DTO برای به‌روزرسانی رکورد حقوق و دستمزد
 */
export class UpdatePayrollDto {
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
   * حقوق پایه
   */
  @ApiPropertyOptional({
    description: 'حقوق پایه',
    example: 5000000,
  })
  @Type(() => Number)
  @IsNumber({}, { message: 'حقوق پایه باید یک عدد باشد' })
  @Min(0, { message: 'حقوق پایه نمی‌تواند منفی باشد' })
  @IsOptional()
  baseSalary?: number;

  /**
   * پاداش‌ها
   */
  @ApiPropertyOptional({
    description: 'پاداش‌ها',
    example: 500000,
  })
  @Type(() => Number)
  @IsNumber({}, { message: 'پاداش‌ها باید یک عدد باشد' })
  @Min(0, { message: 'پاداش‌ها نمی‌تواند منفی باشد' })
  @IsOptional()
  bonuses?: number;

  /**
   * کسورات
   */
  @ApiPropertyOptional({
    description: 'کسورات',
    example: 200000,
  })
  @Type(() => Number)
  @IsNumber({}, { message: 'کسورات باید یک عدد باشد' })
  @Min(0, { message: 'کسورات نمی‌تواند منفی باشد' })
  @IsOptional()
  deductions?: number;

  /**
   * وضعیت پرداخت
   */
  @ApiPropertyOptional({
    description: 'وضعیت پرداخت',
    example: PayrollStatus.PENDING,
    enum: PayrollStatus,
  })
  @IsEnum(PayrollStatus, {
    message: `وضعیت باید ${PayrollStatus.PAID} یا ${PayrollStatus.PENDING} باشد`,
  })
  @IsOptional()
  status?: PayrollStatus;

  /**
   * یادداشت‌های اضافی
   */
  @ApiPropertyOptional({
    description: 'یادداشت‌های اضافی',
    example: 'پرداخت انجام شد',
  })
  @IsString({ message: 'یادداشت باید یک رشته متنی باشد' })
  @IsOptional()
  notes?: string;
}
