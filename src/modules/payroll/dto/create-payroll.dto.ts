import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  Min,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { payrollStatus } from '../../../../generated/prisma/enums.js';

/**
 * DTO برای ایجاد رکورد حقوق و دستمزد
 */
export class CreatePayrollDto {
  /**
   * شناسه کاربر
   */
  @ApiProperty({
    description: 'شناسه کاربر',
    example: 1,
  })
  @Type(() => Number)
  @IsNumber({}, { message: 'شناسه کاربر باید یک عدد باشد' })
  @Min(1, { message: 'شناسه کاربر باید بزرگتر از صفر باشد' })
  @IsNotEmpty({ message: 'شناسه کاربر الزامی است' })
  userId!: number;

  /**
   * دوره (ماه و سال)
   */
  @ApiProperty({
    description: 'دوره حقوق (فرمت: YYYY-MM)',
    example: '1404/08',
  })
  @IsString({ message: 'دوره باید یک رشته متنی باشد' })
  @Matches(/^\d{4}\/\d{2}$/, {
    message: 'فرمت دوره صحیح نیست. باید به صورت YYYY-MM باشد (مثلاً 1404/01)',
  })
  @IsNotEmpty({ message: 'دوره الزامی است' })
  salaryPeriod!: string;

  /**
   * حقوق پایه
   */
  @ApiProperty({
    description: 'حقوق پایه',
    example: 5000000,
  })
  @Type(() => Number)
  @IsNumber({}, { message: 'حقوق پایه باید یک عدد باشد' })
  @Min(0, { message: 'حقوق پایه نمی‌تواند منفی باشد' })
  @IsNotEmpty({ message: 'حقوق پایه الزامی است' })
  baseSalary!: number;

  /**
   * پاداش‌ها (اختیاری)
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
   * کسورات (اختیاری)
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

  @ApiPropertyOptional({
    description: 'وضعیت پرداخت',
    example: payrollStatus.PENDING,
    enum: payrollStatus,
  })
  @IsEnum(payrollStatus, {
    message: `وضعیت باید ${payrollStatus.PAID} یا ${payrollStatus.PENDING} باشد`,
  })
  @IsOptional()
  status?: payrollStatus;

  /**
   * یادداشت‌های اضافی (اختیاری)
   */
  @ApiPropertyOptional({
    description: 'یادداشت‌های اضافی',
    example: 'پرداخت حقوق ماه دی',
  })
  @IsString({ message: 'یادداشت باید یک رشته متنی باشد' })
  @IsOptional()
  notes?: string;
}
