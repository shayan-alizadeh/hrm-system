import { Transform } from 'class-transformer';
import { IsEnum, IsInt, Max, Min, ValidateIf } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

import { ContractStatus } from '../../../../generated/prisma/enums.js';

export class FilterContractDto {
  @ApiPropertyOptional({
    description: 'شناسه کارمند',
    example: 5,
    type: 'integer',
    minimum: 1,
    maximum: 2_147_483_647,
  })
  @Transform(({ value }: { value: unknown }) => {
    // ورودی نامعتبر حفظ می‌شود تا اعتبارسنجی آن را رد کند.
    if (typeof value === 'string' && /^\d+$/.test(value)) {
      return Number(value);
    }

    return value;
  })
  @ValidateIf((_object: unknown, value: unknown) => value !== undefined)
  @IsInt({ message: 'شناسه کارمند باید عدد صحیح باشد.' })
  @Min(1, { message: 'شناسه کارمند باید بزرگ‌تر از صفر باشد.' })
  @Max(2_147_483_647, {
    message: 'شناسه کارمند خارج از محدوده مجاز است.',
  })
  userId?: number;

  @ApiPropertyOptional({
    description: 'وضعیت ثبت‌شده قرارداد',
    enum: ContractStatus,
    enumName: 'ContractStatus',
    example: ContractStatus.ACTIVE,
  })
  @ValidateIf((_object: unknown, value: unknown) => value !== undefined)
  @IsEnum(ContractStatus, {
    message: 'وضعیت قرارداد نامعتبر است.',
  })
  status?: ContractStatus;
}
