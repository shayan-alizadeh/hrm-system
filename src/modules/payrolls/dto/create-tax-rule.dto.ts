import {
  IsDefined,
  IsInt,
  IsNumber,
  IsOptional,
  Max,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * مشخصات یک پله مالیاتی.
 * مقایسه کف و سقف و بررسی هم‌پوشانی پله‌ها در سرویس انجام می‌شود.
 */
export class CreateTaxRuleDto {
  @ApiProperty({
    description: 'سال شمسی',
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
    description: 'کف درآمد پله مالیاتی به ریال',
    example: 120_000_000,
    type: Number,
    minimum: 0,
    maximum: Number.MAX_SAFE_INTEGER,
  })
  @IsDefined({ message: 'کف درآمد الزامی است.' })
  @IsNumber(
    { allowNaN: false, allowInfinity: false },
    { message: 'کف درآمد باید عدد معتبر باشد.' },
  )
  @Min(0, { message: 'کف درآمد نمی‌تواند منفی باشد.' })
  @Max(Number.MAX_SAFE_INTEGER, {
    message: 'کف درآمد خارج از محدوده مجاز است.',
  })
  minIncome!: number;

  @ApiPropertyOptional({
    description:
      'سقف درآمد به ریال؛ هنگام ایجاد، حذف فیلد یا ارسال null به معنی نداشتن سقف است.',
    example: 165_000_000,
    type: Number,
    nullable: true,
    minimum: 0,
    maximum: Number.MAX_SAFE_INTEGER,
  })
  // null در این فیلد معنای مشخصی دارد و عمداً مجاز است.
  @IsOptional()
  @IsNumber(
    { allowNaN: false, allowInfinity: false },
    { message: 'سقف درآمد باید عدد معتبر یا null باشد.' },
  )
  @Min(0, { message: 'سقف درآمد نمی‌تواند منفی باشد.' })
  @Max(Number.MAX_SAFE_INTEGER, {
    message: 'سقف درآمد خارج از محدوده مجاز است.',
  })
  maxIncome?: number | null;

  @ApiProperty({
    description: 'درصد مالیات پله',
    example: 10,
    type: Number,
    minimum: 0,
    maximum: 100,
  })
  @IsDefined({ message: 'درصد مالیات الزامی است.' })
  @IsNumber(
    { allowNaN: false, allowInfinity: false },
    { message: 'درصد مالیات باید عدد معتبر باشد.' },
  )
  @Min(0, { message: 'درصد مالیات نمی‌تواند کمتر از صفر باشد.' })
  @Max(100, { message: 'درصد مالیات نمی‌تواند بیشتر از صد باشد.' })
  percentage!: number;
}
