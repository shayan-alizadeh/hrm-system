import {
  IsNotEmpty,
  IsString,
  IsEnum,
  Matches,
  IsNumber,
  Min,
  IsOptional,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ContractType } from '../../../../generated/prisma/enums.js'; 

export class CreateContractDto {
  @ApiProperty({ description: 'شناسه کارمند', example: 5 })
  @IsNumber()
  @Min(1)
  @IsNotEmpty({ message: 'شناسه کاربر الزامی است' })
  userId!: number;

  @ApiProperty({ description: 'شماره یکتای قرارداد', example: 'CNT-1404-0012' })
  @IsString()
  @IsNotEmpty({ message: 'شماره قرارداد الزامی است' })
  contractNo!: string;

  @ApiProperty({
    description: 'عنوان شغلی',
    example: 'Senior Backend Developer',
  })
  @IsString()
  @IsNotEmpty({ message: 'عنوان شغلی الزامی است' })
  jobTitle!: string;

  @ApiProperty({
    description: 'نوع قرارداد',
    enum: ContractType,
    example: ContractType.FULL_TIME,
  })
  @IsEnum(ContractType, { message: 'نوع قرارداد نامعتبر است' })
  @IsNotEmpty()
  type!: ContractType;

  @ApiProperty({
    description: 'تاریخ شروع (YYYY/MM/DD)',
    example: '1404/01/01',
  })
  @IsString()
  @Matches(/^(13|14)\d{2}\/(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])$/)
  @IsNotEmpty()
  startDate!: string;

  @ApiProperty({
    description: 'تاریخ پایان (YYYY/MM/DD)',
    example: '1404/12/29',
  })
  @IsString()
  @Matches(/^(13|14)\d{2}\/(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])$/)
  @IsNotEmpty()
  endDate!: string;

  @ApiProperty({ description: 'حقوق پایه (تومان/ریال)', example: 15000000 })
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  baseSalary!: number;

  @ApiPropertyOptional({ description: 'حق مسکن', example: 900000 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  housingAllowance?: number;

  @ApiPropertyOptional({ description: 'حق بن کارگری', example: 1400000 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  foodAllowance?: number;

  @ApiPropertyOptional({ description: 'حق اولاد', example: 700000 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  childAllowance?: number;

  @ApiPropertyOptional({
    description: 'شماره بیمه تامین اجتماعی',
    example: '1234567890',
  })
  @IsString()
  @IsOptional()
  insuranceNo?: string;

  @ApiPropertyOptional({ description: 'یادداشت‌های قرارداد' })
  @IsString()
  @IsOptional()
  notes?: string;
}
