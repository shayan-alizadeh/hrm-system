import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDepartmentDto {
  @ApiProperty({
    description: 'نام دپارتمان',
    example: 'فناوری اطلاعات (IT)',
    maxLength: 100,
  })
  @IsString({ message: 'نام دپارتمان باید یک رشته متنی باشد.' })
  @IsNotEmpty({ message: 'وارد کردن نام دپارتمان الزامی است.' })
  @MaxLength(100, {
    message: 'نام دپارتمان نمی‌تواند بیشتر از ۱۰۰ کاراکتر باشد.',
  })
  name!: string;

  @ApiPropertyOptional({
    description: 'توضیحات دپارتمان',
    example: 'بخش توسعه نرم‌افزار و مدیریت زیرساخت شبکه‌ی سازمان',
  })
  @IsString({ message: 'توضیحات باید یک رشته متنی باشد.' })
  @IsOptional()
  description?: string;
}
