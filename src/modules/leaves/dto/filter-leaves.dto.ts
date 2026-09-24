import { IsOptional, IsInt, IsEnum, Matches, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { LeaveStatus, LeaveType } from '../../../../generated/prisma/enums.js';

export class FilterLeavesDto {
  @ApiPropertyOptional({
    description: 'شناسه کاربر (فقط برای مدیران)',
    example: 1,
  })
  @Type(() => Number)
  @IsInt({ message: 'شناسه کاربر باید یک عدد صحیح باشد' })
  @Min(1, { message: 'شناسه کاربر نامعتبر است' })
  @IsOptional()
  userId?: number;

  @ApiPropertyOptional({
    description: 'وضعیت مرخصی',
    example: LeaveStatus.PENDING,
    enum: LeaveStatus,
  })
  @IsEnum(LeaveStatus, { message: 'وضعیت انتخاب شده نامعتبر است' })
  @IsOptional()
  status?: LeaveStatus;

  @ApiPropertyOptional({
    description: 'نوع مرخصی',
    example: LeaveType.ANNUAL,
    enum: LeaveType,
  })
  @IsEnum(LeaveType, { message: 'نوع مرخصی انتخاب شده نامعتبر است' })
  @IsOptional()
  leaveType?: LeaveType;

  @ApiPropertyOptional({ description: 'از تاریخ (فرمت: YYYY/MM/DD)' })
  @Matches(/^(13|14)\d{2}\/(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])$/)
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ description: 'تا تاریخ (فرمت: YYYY/MM/DD)' })
  @Matches(/^(13|14)\d{2}\/(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])$/)
  @IsOptional()
  endDate?: string;
}
