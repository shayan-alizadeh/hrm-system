import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';

import { CreateTaxRuleDto } from './create-tax-rule.dto.js';

/**
 * فیلدهای ارسال‌نشده بدون تغییر باقی می‌مانند.
 * فقط maxIncome به دلیل IsOptional در کلاس پایه، null می‌پذیرد.
 */
export class UpdateTaxRuleDto extends PartialType(CreateTaxRuleDto, {
  skipNullProperties: false,
}) {
  @ApiPropertyOptional({
    description:
      'سقف درآمد به ریال؛ حذف فیلد یعنی عدم تغییر و ارسال null یعنی حذف سقف.',
    example: 165_000_000,
    type: Number,
    nullable: true,
    minimum: 0,
    maximum: Number.MAX_SAFE_INTEGER,
  })
  declare maxIncome?: number | null;
}
