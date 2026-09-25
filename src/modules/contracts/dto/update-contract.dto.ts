import { PartialType, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ContractStatus } from '../../../../generated/prisma/enums.js'; 
import { CreateContractDto } from './create-contract.dto.js'; // در صورت نیاز پسوند .js

export class UpdateContractDto extends PartialType(CreateContractDto) {
  @ApiPropertyOptional({
    description: 'وضعیت قرارداد (فعال، پایان‌یافته، فسخ‌شده)',
    enum: ContractStatus,
    example: ContractStatus.TERMINATED,
  })
  @IsEnum(ContractStatus, { message: 'وضعیت قرارداد انتخاب شده نامعتبر است' })
  @IsOptional()
  status?: ContractStatus;

  @ApiPropertyOptional({
    description: 'مسیر فایل اسکن شده قرارداد (PDF/Image)',
    example: '/uploads/contracts/cnt-1404-0012.pdf',
  })
  @IsString()
  @IsOptional()
  fileUrl?: string;
}
