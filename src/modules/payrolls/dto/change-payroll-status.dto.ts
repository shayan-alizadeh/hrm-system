import { ApiProperty } from '@nestjs/swagger';
import { IsDefined, IsEnum } from 'class-validator';

import { PayrollStatus } from '../../../../generated/prisma/enums.js';

export class ChangePayrollStatusDto {
  @ApiProperty({
    description: 'وضعیت جدید فیش حقوقی',
    enum: PayrollStatus,
    enumName: 'PayrollStatus',
    example: PayrollStatus.PAID,
  })
  @IsDefined({ message: 'ارسال وضعیت فیش حقوقی الزامی است.' })
  @IsEnum(PayrollStatus, {
    message: 'وضعیت باید PENDING یا PAID باشد.',
  })
  status!: PayrollStatus;
}
