import { IsOptional, IsDateString, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateAttendanceDto {
  @ApiPropertyOptional({ description: 'اصلاح دقیق ساعت ورود (ISO String)' })
  @IsOptional()
  @IsDateString()
  checkIn?: string;

  @ApiPropertyOptional({ description: 'اصلاح دقیق ساعت خروج (ISO String)' })
  @IsOptional()
  @IsDateString()
  checkOut?: string;

  @ApiPropertyOptional({ description: 'یادداشت مدیر برای این اصلاح' })
  @IsOptional()
  @IsString()
  notes?: string;
}
