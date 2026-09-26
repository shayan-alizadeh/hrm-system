import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { Roles } from '../../auth/decorators/roles.decorator.js';
import { RoleType } from '../../../../generated/prisma/client.js';
import { CurrentUser } from '../../../common/decorators/user.decorator.js';

import { PayrollEmployeeService } from '../services/payroll-employee.service.js';
import { FilterPayrollDto } from '../dto/filter-payroll.dto.js';

@ApiTags('Payroll - Employee')
@ApiBearerAuth()
@Roles(RoleType.EMPLOYEE)
@Controller('employee/payroll')
export class PayrollEmployeeController {
  constructor(
    private readonly payrollEmployeeService: PayrollEmployeeService,
  ) {}

  @Get('my-payrolls')
  @ApiOperation({ summary: 'دریافت لیست فیش‌های حقوقی من' })
  async findMyPayrolls(
    @CurrentUser() user: { id: number },
    @Query() filters: FilterPayrollDto,
  ) {
    return await this.payrollEmployeeService.findMyPayrolls(user.id, filters);
  }

  @Get('my-payrolls/:id')
  @ApiOperation({ summary: 'دریافت جزئیات یک فیش حقوقی من' })
  async findOne(
    @CurrentUser() user: { id: number },
    @Param('id', ParseIntPipe) id: number,
  ) {
    return await this.payrollEmployeeService.findOne(id, user.id);
  }
}
