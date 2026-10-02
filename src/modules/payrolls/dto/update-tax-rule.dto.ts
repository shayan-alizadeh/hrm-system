import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

import { CreateTaxRuleDto } from './create-tax-rule.dto.js';

/**
 * فیلدهای ارسال‌نشده بدون تغییر باقی می‌مانند.
 * فقط maxIncome به دلیل IsOptional null می‌پذیرد.
 */
export class UpdateTaxRuleDto extends PartialType(CreateTaxRuleDto) {
  // همچنین ولیدیتورها مجدداً اضافه شدند تا در صورت اورراید شدن فیلد، امنیت حفظ شود.
  @ApiPropertyOptional({
    description:
      'سقف درآمد به ریال؛ حذف فیلد یعنی عدم تغییر و ارسال null یعنی حذف سقف.',
    example: 165_000_000,
    type: Number,
    nullable: true,
    minimum: 0,
    maximum: Number.MAX_SAFE_INTEGER,
  })
  @IsOptional()
  @IsInt({ message: 'سقف درآمد باید عدد صحیح معتبر یا null باشد.' })
  @Min(0, { message: 'سقف درآمد نمی‌تواند منفی باشد.' })
  @Max(Number.MAX_SAFE_INTEGER, {
    message: 'سقف درآمد خارج از محدوده مجاز است.',
  })
  maxIncome?: number | null;
}
