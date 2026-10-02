import { Transform } from 'class-transformer';
import { IsDefined, IsIn, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { LeaveStatus } from '../../../../generated/prisma/enums.js';

export class ResolveLeaveRequestDto {
  @ApiProperty({
    description: 'نتیجه بررسی درخواست؛ فقط تأیید یا رد',
    example: LeaveStatus.APPROVED,
    enum: [LeaveStatus.APPROVED, LeaveStatus.REJECTED],
  })
  @IsDefined({ message: 'انتخاب وضعیت الزامی است.' })
  @IsIn([LeaveStatus.APPROVED, LeaveStatus.REJECTED], {
    message: 'مدیر فقط می‌تواند درخواست را تأیید یا رد کند.',
  })
  // کلمه کلیدی typeof برای آبجکت‌های Prisma در تعریف Type کاملاً ضروری است
  status!: typeof LeaveStatus.APPROVED | typeof LeaveStatus.REJECTED;

  @ApiPropertyOptional({
    description:
      'یادداشت مدیر؛ حذف فیلد یعنی عدم تغییر و null یعنی خالی کردن یادداشت.',
    example: 'با توجه به حجم کاری پایان ماه، با مرخصی موافقت نمی‌شود.',
    type: String,
    nullable: true,
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsOptional()
  @IsString({ message: 'یادداشت مدیر باید متن یا null باشد.' })
  managerNote?: string | null;
}
