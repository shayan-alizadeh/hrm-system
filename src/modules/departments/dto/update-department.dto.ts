import { IsOptional, IsString, MaxLength } from 'class-validator';


export class UpdateDepartmentDto {
  /** نام جدید دپارتمان */
  @IsString()
  @IsOptional()
  @MaxLength(100)
  name?: string;

  /** توضیحات جدید */
  @IsString()
  @IsOptional()
  description?: string;
}
