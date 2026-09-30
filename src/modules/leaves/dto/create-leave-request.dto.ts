import { Transform } from 'class-transformer';
import {
  IsDefined,
  IsEnum,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

import { LeaveType } from '../../../../generated/prisma/enums.js';
import { IsJalaliDate } from '../../../common/validators/is-jalali-date.validator.js';

export class CreateLeaveRequestDto {
  @ApiProperty({
    description: 'نوع مرخصی',
    example: LeaveType.ANNUAL,
    enum: LeaveType,
    enumName: 'LeaveType',
  })
  @IsDefined({ message: 'انتخاب نوع مرخصی الزامی است.' })
  @IsEnum(LeaveType, { message: 'نوع مرخصی نامعتبر است.' })
  leaveType!: LeaveType;

  @ApiProperty({
    description: 'تاریخ شمسی شروع مرخصی با قالب yyyy/mm/dd',
    example: '1404/09/01',
    type: String,
    minLength: 10,
    maxLength: 10,
  })
  @IsDefined({ message: 'تاریخ شروع مرخصی الزامی است.' })
  @IsString({ message: 'تاریخ شروع باید رشته متنی باشد.' })
  @IsJalaliDate({
    message: 'تاریخ شروع شمسی معتبر نیست.',
  })
  startDate!: string;

  @ApiProperty({
    description: 'تاریخ شمسی پایان مرخصی با قالب yyyy/mm/dd',
    example: '1404/09/03',
    type: String,
    minLength: 10,
    maxLength: 10,
  })
  @IsDefined({ message: 'تاریخ پایان مرخصی الزامی است.' })
  @IsString({ message: 'تاریخ پایان باید رشته متنی باشد.' })
  @IsJalaliDate({
    message: 'تاریخ پایان شمسی معتبر نیست.',
  })
  endDate!: string;

  @ApiProperty({
    description: 'دلیل درخواست مرخصی',
    example: 'رسیدگی به امور شخصی و بانکی',
    minLength: 5,
    maxLength: 500,
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsDefined({ message: 'نوشتن دلیل مرخصی الزامی است.' })
  @IsString({ message: 'دلیل مرخصی باید متن باشد.' })
  @MinLength(5, {
    message: 'دلیل مرخصی نمی‌تواند کمتر از ۵ کاراکتر باشد.',
  })
  @MaxLength(500, {
    message: 'دلیل مرخصی نمی‌تواند بیشتر از ۵۰۰ کاراکتر باشد.',
  })
  reason!: string;
}
