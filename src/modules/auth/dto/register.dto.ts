import {
  IsString,
  IsEnum,
  IsOptional,
  IsNotEmpty,
  Matches,
  MinLength,
} from 'class-validator';
// توجه: آدرس ایمپورت رو به Prisma Client جدید تغییر دادم
import { RoleType } from '../../../../generated/prisma/enums.js';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  // --- فیلدهای جدید اضافه شده ---
  @ApiProperty({
    description: 'نام کاربر',
    example: 'علی',
  })
  @IsString({ message: 'نام باید یک رشته متنی باشد' })
  @IsNotEmpty({ message: 'نام الزامی است' })
  firstName!: string;

  @ApiProperty({
    description: 'نام خانوادگی کاربر',
    example: 'علوی',
  })
  @IsString({ message: 'نام خانوادگی باید یک رشته متنی باشد' })
  @IsNotEmpty({ message: 'نام خانوادگی الزامی است' })
  lastName!: string;
  // ------------------------------

  @ApiProperty({
    description:
      'شماره موبایل کاربر (باید با الگوی شماره موبایل ایرانی مطابقت داشته باشد)',
    example: '09135882813',
    pattern: '^09\\d{9}$',
    minLength: 11,
    maxLength: 11,
  })
  @IsString({ message: 'شماره موبایل باید یک رشته متنی باشد' })
  @IsNotEmpty({ message: 'شماره موبایل الزامی است' })
  @Matches(/^09\d{9}$/, {
    message:
      'شماره موبایل باید با الگوی شماره موبایل ایرانی (09xxxxxxxxx) مطابقت داشته باشد',
  })
  mobile!: string;

  @ApiProperty({
    description: 'رمز عبور کاربر (حداقل 6 کاراکتر)',
    example: '123456',
    minLength: 6,
  })
  @IsString({ message: 'رمز عبور باید یک رشته متنی باشد' })
  @IsNotEmpty({ message: 'رمز عبور الزامی است' })
  @MinLength(6, { message: 'رمز عبور باید حداقل 6 کاراکتر باشد' })
  password!: string;

  @ApiPropertyOptional({
    description: 'نقش کاربری (MANAGER یا EMPLOYEE)',
    example: 'EMPLOYEE',
    enum: RoleType, // به RoleType تغییر یافت
    enumName: 'RoleType',
  })
  @IsOptional()
  @IsEnum(RoleType, {
    message: 'نقش کاربری باید یکی از مقادیر MANAGER یا EMPLOYEE باشد', // مقادیر به حروف بزرگ اصلاح شد
  })
  role?: RoleType;
}
