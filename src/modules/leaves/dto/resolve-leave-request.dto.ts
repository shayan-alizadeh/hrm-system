import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsOptional,
  IsIn,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LeaveStatus } from '../../../../generated/prisma/enums.js';

export class ResolveLeaveRequestDto {
  @ApiProperty({
    description: 'وضعیت جدید درخواست (فقط تایید یا رد)',
    example: LeaveStatus.APPROVED,
    // مدیر نمی‌تواند وضعیت را به PENDING برگرداند یا CANCELED کند
    enum: [LeaveStatus.APPROVED, LeaveStatus.REJECTED],
  })
  @IsIn([LeaveStatus.APPROVED, LeaveStatus.REJECTED], {
    message:
      'مدیر فقط می‌تواند درخواست را تایید (APPROVED) یا رد (REJECTED) کند',
  })
  @IsNotEmpty({ message: 'انتخاب وضعیت الزامی است' })
  status!: LeaveStatus;

  @ApiPropertyOptional({
    description: 'یادداشت مدیر (مثلاً دلیل رد شدن مرخصی)',
    example: 'با توجه به حجم کاری پایان ماه، با مرخصی موافقت نمی‌شود.',
  })
  @IsString({ message: 'یادداشت مدیر باید متن باشد' })
  @IsOptional()
  managerNote?: string;
}
