import { PartialType } from '@nestjs/swagger';

import { CreateHolidayDto } from './create-holiday.dto.js';

/**
 * فیلدهای ارسال‌نشده بدون تغییر می‌مانند.
 * تاریخ و عنوان در دیتابیس nullable نیستند؛ null باید رد شود.
 */
export class UpdateHolidayDto extends PartialType(CreateHolidayDto, {
  skipNullProperties: false,
}) {}
