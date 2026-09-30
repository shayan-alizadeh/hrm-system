import { IsDefined, IsInt, Max, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * ورودی صدور فیش حقوقی.
 * مبالغ توسط سرویس محاسبه می‌شوند و از کلاینت دریافت نمی‌شوند.
 */
export class CreatePayrollDto {
  @ApiProperty({
    description: 'شناسه کارمند',
    example: 5,
    type: 'integer',
    minimum: 1,
    maximum: 2_147_483_647,
  })
  @IsDefined({ message: 'شناسه کارمند الزامی است.' })
  @IsInt({ message: 'شناسه کارمند باید عدد صحیح باشد.' })
  @Min(1, { message: 'شناسه کارمند باید بزرگ‌تر از صفر باشد.' })
  @Max(2_147_483_647, {
    message: 'شناسه کارمند خارج از محدوده مجاز است.',
  })
  userId!: number;

  @ApiProperty({
    description: 'سال شمسی فیش حقوقی',
    example: 1404,
    type: 'integer',
    minimum: 1300,
    maximum: 1499,
  })
  @IsDefined({ message: 'سال الزامی است.' })
  @IsInt({ message: 'سال باید عدد صحیح باشد.' })
  @Min(1300, { message: 'سال نمی‌تواند کمتر از ۱۳۰۰ باشد.' })
  @Max(1499, { message: 'سال نمی‌تواند بیشتر از ۱۴۹۹ باشد.' })
  year!: number;

  @ApiProperty({
    description: 'ماه شمسی فیش حقوقی',
    example: 8,
    type: 'integer',
    minimum: 1,
    maximum: 12,
  })
  @IsDefined({ message: 'ماه الزامی است.' })
  @IsInt({ message: 'ماه باید عدد صحیح باشد.' })
  @Min(1, { message: 'ماه نمی‌تواند کمتر از ۱ باشد.' })
  @Max(12, { message: 'ماه نمی‌تواند بیشتر از ۱۲ باشد.' })
  month!: number;
}
