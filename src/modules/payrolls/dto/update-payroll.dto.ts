import { PartialType } from '@nestjs/swagger';

import { CreatePayrollDto } from './create-payroll.dto.js';

/**
 * فیلدهای ارسال‌نشده اعتبارسنجی نمی‌شوند؛ ارسال null مجاز نیست.
 *
 * استفاده احتمالی برای تغییر کارمند یا دوره فیش، نیازمند
 * محاسبه مجدد مبالغ در سرویس است؛ تغییر مستقیم این فیلدها کافی نیست.
 */
export class UpdatePayrollDto extends PartialType(CreatePayrollDto, {
  skipNullProperties: false,
}) {}
