import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { RoleType } from '../../../../generated/prisma/enums.js';
import { CurrentUser } from '../../../common/decorators/user.decorator.js';
import { Roles } from '../../auth/decorators/roles.decorator.js';
import { ContractService } from '../services/contract.service.js';

@ApiTags('Contracts - Employee')
@ApiBearerAuth()
@Roles(RoleType.EMPLOYEE)
@Controller('employee/contracts')
export class ContractEmployeeController {
  constructor(private readonly contractsService: ContractService) {}

  @Get('my-active')
  @ApiOperation({
    summary: 'مشاهده قرارداد دارای وضعیت فعال من',
  })
  async getMyActiveContract(@CurrentUser() user: { id: number }) {
    return this.contractsService.getActiveContractByUserId(user.id);
  }

  @Get('my-history')
  @ApiOperation({
    summary: 'مشاهده تمام قراردادهای من، شامل فعال، منقضی‌شده و فسخ‌شده',
  })
  async getMyContractsHistory(@CurrentUser() user: { id: number }) {
    // شناسه کارمند از درخواست یا Query دریافت نمی‌شود.
    return this.contractsService.getAllContracts(user.id);
  }
}
