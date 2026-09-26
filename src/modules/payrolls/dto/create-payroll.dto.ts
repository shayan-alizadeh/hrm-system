import { IsNotEmpty, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePayrollDto {
  @ApiProperty({ description: 'شناسه کارمند', example: 5 })
  @IsNumber()
  @IsNotEmpty()
  userId!: number;

  @ApiProperty({ description: 'سال (مثلاً 1404)', example: 1404 })
  @IsNumber()
  @IsNotEmpty()
  year!: number;

  @ApiProperty({ description: 'ماه (1 تا 12)', example: 8 })
  @IsNumber()
  @Min(1)
  @Max(12)
  @IsNotEmpty()
  month!: number;
}
