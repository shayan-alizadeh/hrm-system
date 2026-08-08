import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';


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
