import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsByteLength,
  IsIn,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';

import type { RoleType } from '../../../../generated/prisma/enums.js';

/**
 * ورودی ثبت‌نام عمومی کارمند.
 *
 * محدودیت طول نام‌ها با ستون‌های User در schema هماهنگ است.
 * محدودیت نقش در AuthService نیز مستقل از DTO اعمال می‌شود.
 */
export class RegisterDto {
  @ApiProperty({
    description: 'نام کاربر؛ فاصله‌های ابتدا و انتها حذف می‌شوند',
    example: 'علی',
    minLength: 1,
    maxLength: 50,
  })
  @Transform(
    ({ value }: { value: unknown }) =>
      typeof value === 'string' ? value.trim() : value,
    { toClassOnly: true },
  )
  @IsString({ message: 'نام باید یک رشته متنی باشد' })
  @IsNotEmpty({
    message: 'نام الزامی است و نمی‌تواند فقط فاصله باشد',
  })
  @MaxLength(50, {
    message: 'نام نباید بیشتر از ۵۰ کاراکتر باشد',
  })
  firstName!: string;

  @ApiProperty({
    description: 'نام خانوادگی کاربر؛ فاصله‌های ابتدا و انتها حذف می‌شوند',
    example: 'علوی',
    minLength: 1,
    maxLength: 50,
  })
  @Transform(
    ({ value }: { value: unknown }) =>
      typeof value === 'string' ? value.trim() : value,
    { toClassOnly: true },
  )
  @IsString({
    message: 'نام خانوادگی باید یک رشته متنی باشد',
  })
  @IsNotEmpty({
    message: 'نام خانوادگی الزامی است و نمی‌تواند فقط فاصله باشد',
  })
  @MaxLength(50, {
    message: 'نام خانوادگی نباید بیشتر از ۵۰ کاراکتر باشد',
  })
  lastName!: string;

  @ApiProperty({
    description: 'شماره موبایل ایران با ارقام انگلیسی و قالب 09xxxxxxxxx',
    example: '09123456789',
    pattern: '^09\\d{9}$',
    minLength: 11,
    maxLength: 11,
  })
  @IsString({
    message: 'شماره موبایل باید یک رشته متنی باشد',
  })
  @IsNotEmpty({
    message: 'شماره موبایل الزامی است',
  })
  @Matches(/^09\d{9}$/, {
    message: 'شماره موبایل باید با قالب 09xxxxxxxxx مطابقت داشته باشد',
  })
  mobile!: string;

  /**
   * رمز عبور بدون تغییر محتوا پردازش می‌شود.
   * سقف ۷۲ بایت با محدودیت ورودی bcrypt هماهنگ است.
   */
  @ApiProperty({
    description: 'رمز عبور؛ حداقل ۶ کاراکتر و حداکثر ۷۲ بایت UTF-8',
    example: 'Sample-Pass-2026!',
    minLength: 6,
    writeOnly: true,
  })
  @IsString({
    message: 'رمز عبور باید یک رشته متنی باشد',
  })
  @IsNotEmpty({
    message: 'رمز عبور الزامی است',
  })
  @MinLength(6, {
    message: 'رمز عبور باید حداقل ۶ کاراکتر باشد',
  })
  @IsByteLength(1, 72, {
    message: 'رمز عبور نباید بیشتر از ۷۲ بایت UTF-8 باشد',
  })
  password!: string;

  /**
   * حذف فیلد مجاز است و سرویس نقش EMPLOYEE را اعمال می‌کند.
   * برای سازگاری با کلاینت، ارسال صریح EMPLOYEE نیز پذیرفته می‌شود.
   */
  @ApiPropertyOptional({
    description: 'در ثبت‌نام عمومی فقط EMPLOYEE مجاز است',
    example: 'EMPLOYEE',
    enum: ['EMPLOYEE'],
    enumName: 'PublicRegistrationRole',
  })
  @ValidateIf((_object: unknown, value: unknown) => value !== undefined)
  @IsIn(['EMPLOYEE'], {
    message: 'ثبت‌نام عمومی فقط برای نقش EMPLOYEE مجاز است',
  })
  role?: RoleType;
}
