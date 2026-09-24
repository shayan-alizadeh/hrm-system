import { IsNotEmpty, IsNumber, IsOptional, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTaxRuleDto {
  @ApiProperty({ description: 'سال شمسی', example: 1404 })
  @Type(() => Number)
  @IsNumber({}, { message: 'سال باید عدد باشد' })
  @IsNotEmpty({ message: 'سال الزامی است' })
  year!: number;

  @ApiProperty({ description: 'کف پله مالیاتی (به ریال)', example: 120000000 })
  @Type(() => Number)
  @IsNumber({}, { message: 'کف پله باید عدد باشد' })
  @Min(0, { message: 'کف پله نمی‌تواند منفی باشد' })
  @IsNotEmpty({ message: 'کف پله الزامی است' })
  minIncome!: number;

  @ApiPropertyOptional({
    description: 'سقف پله مالیاتی (به ریال) - برای پله آخر خالی بگذارید',
    example: 165000000,
  })
  @Type(() => Number)
  @IsNumber({}, { message: 'سقف پله باید عدد باشد' })
  @Min(0, { message: 'سقف پله نمی‌تواند منفی باشد' })
  @IsOptional()
  maxIncome?: number;

  @ApiProperty({ description: 'درصد مالیات این پله', example: 10 })
  @Type(() => Number)
  @IsNumber({}, { message: 'درصد مالیات باید عدد باشد' })
  @Min(0, { message: 'درصد نمی‌تواند کمتر از ۰ باشد' })
  @Max(100, { message: 'درصد نمی‌تواند بیشتر از ۱۰۰ باشد' })
  @IsNotEmpty({ message: 'درصد مالیات الزامی است' })
  percentage!: number;
}
