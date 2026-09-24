import {
  IsNotEmpty,
  IsString,
  IsEnum,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { LeaveType } from '../../../../generated/prisma/enums.js';

export class CreateLeaveRequestDto {
  @ApiProperty({
    description: 'نوع مرخصی',
    example: LeaveType.ANNUAL,
    enum: LeaveType,
  })
  @IsEnum(LeaveType, { message: 'نوع مرخصی نامعتبر است' })
  @IsNotEmpty({ message: 'انتخاب نوع مرخصی الزامی است' })
  leaveType!: LeaveType;

  @ApiProperty({
    description: 'تاریخ شمسی شروع مرخصی (فرمت: YYYY/MM/DD)',
    example: '1404/09/01',
  })
  @IsString({ message: 'تاریخ شروع باید یک رشته متنی باشد' })
  @Matches(/^(13|14)\d{2}\/(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])$/, {
    message: 'فرمت تاریخ شروع صحیح نیست (مثال: 1404/09/01)',
  })
  @IsNotEmpty({ message: 'تاریخ شروع مرخصی الزامی است' })
  startDate!: string;

  @ApiProperty({
    description: 'تاریخ شمسی پایان مرخصی (فرمت: YYYY/MM/DD)',
    example: '1404/09/03',
  })
  @IsString({ message: 'تاریخ پایان باید یک رشته متنی باشد' })
  @Matches(/^(13|14)\d{2}\/(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])$/, {
    message: 'فرمت تاریخ پایان صحیح نیست (مثال: 1404/09/03)',
  })
  @IsNotEmpty({ message: 'تاریخ پایان مرخصی الزامی است' })
  endDate!: string;

  @ApiProperty({
    description: 'دلیل درخواست مرخصی',
    example: 'رسیدگی به امور شخصی و بانکی',
  })
  @IsString({ message: 'دلیل مرخصی باید متن باشد' })
  @MinLength(5, { message: 'دلیل مرخصی نمی‌تواند کمتر از ۵ کاراکتر باشد' })
  @MaxLength(500, { message: 'دلیل مرخصی طولانی‌تر از حد مجاز است' })
  @IsNotEmpty({ message: 'نوشتن دلیل مرخصی الزامی است' })
  reason!: string;
}
