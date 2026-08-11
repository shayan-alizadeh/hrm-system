import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({
    description: 'توکن تازه‌سازی (Refresh Token) برای دریافت توکن دسترسی جدید',
    example: 'token',
  })
  @IsString({ message: 'توکن تازه‌سازی باید یک رشته متنی باشد' })
  @IsNotEmpty({ message: 'توکن تازه‌سازی الزامی است' })
  refreshToken!: string;
}
