import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches } from 'class-validator';

export class FilterHolidaysDto {
  @ApiPropertyOptional({
    description: 'سال شمسی تعطیلات',
    example: '1404',
    type: String,
    pattern: '^1[34]\\d{2}$',
  })
  @IsOptional() // جایگزین تمیزتر برای @ValidateIf
  @IsString({ message: 'سال باید به صورت رشته ارسال شود.' })
  @Matches(/^1[34]\d{2}$/, {
    message: 'سال باید چهاررقمی و بین ۱۳۰۰ و ۱۴۹۹ باشد.',
  })
  year?: string;
}
