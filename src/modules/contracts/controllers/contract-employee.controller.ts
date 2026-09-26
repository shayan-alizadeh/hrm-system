import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { Roles } from '../../auth/decorators/roles.decorator.js';
import { RoleType } from '../../../../generated/prisma/client.js';
import { CurrentUser } from '../../../common/decorators/user.decorator.js'; // دکوراتوری که اطلاعات کاربر لاگین‌شده را می‌دهد

import { ContractService } from '../services/contract.service.js';

@ApiTags('Contracts - Employee')
@ApiBearerAuth()
@Roles(RoleType.EMPLOYEE)
@Controller('employee/contracts')
export class ContractEmployeeController {
  constructor(private readonly contractsService: ContractService) {}

  @Get('my-active')
  @ApiOperation({ summary: 'مشاهده جزئیات قرارداد فعال فعلی من' })
  async getMyActiveContract(@CurrentUser() user: { id: number }) {
    return await this.contractsService.getActiveContractByUserId(user.id);
  }

  @Get('my-history')
  @ApiOperation({
    summary: 'مشاهده تاریخچه تمام قراردادهای من (فعال و منقضی‌شده)',
  })
  async getMyContractsHistory(@CurrentUser() user: { id: number }) {
    // با پاس دادن userId، متد سرویس فقط قراردادهای همین شخص را برمی‌گرداند
    return await this.contractsService.getAllContracts(user.id);
  }
}
