import { IsOptional, IsInt, IsEnum, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PayrollStatus } from '../../../../generated/prisma/client.js';

export class FilterPayrollDto {
  @ApiPropertyOptional({
    description: 'شناسه کاربر (فقط برای مدیران کار می‌کند)',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  userId?: number;

  @ApiPropertyOptional({ description: 'سال', example: 1404 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  year?: number;

  @ApiPropertyOptional({ description: 'ماه', example: 8 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  month?: number;

  @ApiPropertyOptional({
    description: 'وضعیت فیش حقوقی',
    enum: PayrollStatus,
    example: PayrollStatus.PENDING,
  })
  @IsOptional()
  @IsEnum(PayrollStatus)
  status?: PayrollStatus;
}
