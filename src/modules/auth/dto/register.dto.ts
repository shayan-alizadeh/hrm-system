import {
  IsEmail,
  IsString,
  IsEnum,
  IsOptional,
  IsNotEmpty,
  Matches,
  MinLength,
} from 'class-validator';
import { roleType } from '../../../../generated/prisma/enums.js';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
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
    enum: roleType,
    enumName: 'Role',
  })
  @IsOptional()
  @IsEnum(roleType, {
    message: 'نقش کاربری باید یکی از مقادیر manager یا employee باشد',
  })
  role?: roleType;
}
