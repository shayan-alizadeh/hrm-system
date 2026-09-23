import {
  IsOptional,
  IsInt,
  IsString,
  Matches,
  Min,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PayrollStatus } from '../../../../generated/prisma/enums.js'; 

export class FilterPayrollDto {
  @ApiPropertyOptional({
    description: 'شناسه کاربر (فقط برای مدیران)',
    example: 1,
  })
  @Type(() => Number)
  @IsInt({ message: 'شناسه کاربر باید یک عدد صحیح باشد' })
  @Min(1, { message: 'شناسه کاربر باید بزرگتر از صفر باشد' })
  @IsOptional()
  userId?: number;

  @ApiPropertyOptional({
    description: 'دوره حقوق (فرمت: YYYY/MM)',
    example: '1404/08',
  })
  @IsString({ message: 'دوره باید یک رشته متنی باشد' })
  @Matches(/^\d{4}\/\d{2}$/, {
    message: 'فرمت دوره صحیح نیست. باید به صورت YYYY/MM باشد',
  })
  @IsOptional()
  salaryPeriod?: string;

  @ApiPropertyOptional({
    description: 'وضعیت پرداخت',
    example: PayrollStatus.PENDING,
    enum: PayrollStatus,
  })
  @IsEnum(PayrollStatus, { message: 'وضعیت پرداخت فیلتر نامعتبر است' })
  @IsOptional()
  status?: PayrollStatus;
}
