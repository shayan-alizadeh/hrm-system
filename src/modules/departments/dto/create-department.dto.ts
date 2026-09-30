import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * ورودی ایجاد دپارتمان.
 * محدودیت طول فیلدها با ستون‌های مدل Department هماهنگ است.
 */
export class CreateDepartmentDto {
  @ApiProperty({
    description: 'نام دپارتمان؛ فاصله‌های ابتدا و انتها حذف می‌شوند',
    example: 'فناوری اطلاعات (IT)',
    minLength: 1,
    maxLength: 100,
  })
  @Transform(
    ({ value }: { value: unknown }) =>
      typeof value === 'string' ? value.trim() : value,
    { toClassOnly: true },
  )
  @IsString({
    message: 'نام دپارتمان باید یک رشته متنی باشد.',
  })
  @IsNotEmpty({
    message: 'نام دپارتمان الزامی است و نمی‌تواند فقط فاصله باشد.',
  })
  @MaxLength(100, {
    message: 'نام دپارتمان نمی‌تواند بیشتر از ۱۰۰ کاراکتر باشد.',
  })
  name!: string;

  /**
   * توضیحات در دیتابیس nullable است؛ حذف فیلد و ارسال null مجازند.
   * محتوای متن بدون تغییر ذخیره می‌شود.
   */
  @ApiPropertyOptional({
    type: String,
    description: 'توضیحات اختیاری دپارتمان',
    example: 'بخش توسعه نرم‌افزار و مدیریت زیرساخت شبکه سازمان',
    maxLength: 250,
    nullable: true,
  })
  @IsOptional()
  @IsString({
    message: 'توضیحات باید یک رشته متنی باشد.',
  })
  @MaxLength(250, {
    message: 'توضیحات نمی‌تواند بیشتر از ۲۵۰ کاراکتر باشد.',
  })
  description?: string | null;
}
