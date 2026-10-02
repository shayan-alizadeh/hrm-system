import { Transform } from 'class-transformer';
import { IsEnum, IsInt, IsString, Max, Min, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

import { LeaveStatus, LeaveType } from '../../../../generated/prisma/enums.js';
import { IsJalaliDate } from '../../../common/validators/is-jalali-date.validator.js';

export class FilterLeaveDto {
  @ApiPropertyOptional({
    description:
      'شناسه کارمند؛ فقط در مسیر مدیر اعمال می‌شود. مسیر کارمند همیشه به کاربر احراز هویت‌شده محدود است.',
    example: 1,
    type: 'integer',
    minimum: 1,
    maximum: 2_147_483_647,
  })
  @Transform(({ value }: { value: unknown }) => {
    if (typeof value === 'string' && /^\d+$/.test(value)) {
      return Number(value);
    }

    return value;
  })
  @IsOptional() // جایگزین تمیزتر برای ValidateIf
  @IsInt({ message: 'شناسه کاربر باید عدد صحیح باشد.' })
  @Min(1, { message: 'شناسه کاربر باید بزرگ‌تر از صفر باشد.' })
  @Max(2_147_483_647, {
    message: 'شناسه کاربر خارج از محدوده مجاز است.',
  })
  userId?: number;

  @ApiPropertyOptional({
    description: 'وضعیت درخواست مرخصی',
    example: LeaveStatus.PENDING,
    enum: LeaveStatus,
    enumName: 'LeaveStatus',
  })
  @IsOptional()
  @IsEnum(LeaveStatus, {
    message: 'وضعیت انتخاب‌شده نامعتبر است.',
  })
  status?: LeaveStatus;

  @ApiPropertyOptional({
    description: 'نوع مرخصی',
    example: LeaveType.ANNUAL,
    enum: LeaveType,
    enumName: 'LeaveType',
  })
  @IsOptional()
  @IsEnum(LeaveType, {
    message: 'نوع مرخصی انتخاب‌شده نامعتبر است.',
  })
  leaveType?: LeaveType;

  @ApiPropertyOptional({
    description: 'ابتدای بازه جست‌وجو؛ درخواست‌های هم‌پوشان برگردانده می‌شوند.',
    example: '1404/09/01',
    type: String,
    minLength: 10,
    maxLength: 10,
  })
  @IsOptional()
  @IsString({ message: 'تاریخ شروع باید رشته متنی باشد.' })
  @IsJalaliDate({ message: 'تاریخ شروع شمسی معتبر نیست.' })
  startDate?: string;

  @ApiPropertyOptional({
    description: 'انتهای بازه جست‌وجو؛ این روز نیز در بازه قرار دارد.',
    example: '1404/09/30',
    type: String,
    minLength: 10,
    maxLength: 10,
  })
  @IsOptional()
  @IsString({ message: 'تاریخ پایان باید رشته متنی باشد.' })
  @IsJalaliDate({ message: 'تاریخ پایان شمسی معتبر نیست.' })
  endDate?: string;
}
