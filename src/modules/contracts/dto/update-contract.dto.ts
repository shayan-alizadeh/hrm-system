import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  ValidateIf,
} from 'class-validator';

import { ContractStatus } from '../../../../generated/prisma/enums.js';
import { CreateContractDto } from './create-contract.dto.js';

/**
 * فیلد ارسال‌نشده بدون تغییر باقی می‌ماند.
 * توجه: به دلیل رفتار PartialType، فیلدهای اجباری در صورت ارسال null از DTO عبور می‌کنند،
 * اما این موضوع توسط متد validateContract در Service مدیریت می‌شود تا دیتابیس دچار خطا نشود.
 */
export class UpdateContractDto extends PartialType(CreateContractDto) {
  @ApiPropertyOptional({
    description: 'وضعیت ثبت‌شده قرارداد',
    enum: ContractStatus,
    enumName: 'ContractStatus',
    example: ContractStatus.TERMINATED,
  })
  @ValidateIf((_object: unknown, value: unknown) => value !== undefined)
  @IsEnum(ContractStatus, {
    message: 'وضعیت قرارداد نامعتبر است.',
  })
  status?: ContractStatus;

  @ApiPropertyOptional({
    description:
      'مسیر یا نشانی فایل قرارداد؛ ارسال null یعنی پاک کردن مقدار ثبت‌شده.',
    example: '/uploads/contracts/cnt-1404-0012.pdf',
    type: String,
    nullable: true,
    maxLength: 191,
  })
  // مسیر نسبی نیز معتبر است؛ بنابراین IsUrl برای این قرارداد API مناسب نیست.
  @IsOptional()
  @IsString({ message: 'مسیر فایل باید متن یا null باشد.' })
  @MaxLength(191, {
    message: 'مسیر فایل نمی‌تواند بیشتر از ۱۹۱ کاراکتر باشد.',
  })
  fileUrl?: string | null;
}
