import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class LoginDto {
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
      'شماره موبایل باید با الگوی شماره موبایل (09xxxxxxxxx) مطابقت داشته باشد',
  })
  mobile!: string;

  @ApiProperty({
    description: 'رمز عبور کاربر',
    example: '123456',
  })
  @IsString({ message: 'رمز عبور باید یک رشته متنی باشد' })
  @IsNotEmpty({ message: 'رمز عبور الزامی است' })
  password!: string;
}
