import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * DTO برای ایجاد دپارتمان
 * از این کلاس در بدنه درخواست POST استفاده می‌کنیم
 */
export class CreateDepartmentDto {
  /** نام دپارتمان (الزامی) */
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  /** توضیحات دپارتمان (اختیاری) */
  @IsString()
  @IsOptional()
  description?: string;
}
