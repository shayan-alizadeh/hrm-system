import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { Roles } from '../../auth/decorators/roles.decorator.js';
import { RoleType } from '../../../../generated/prisma/enums.js';
import {  Payroll } from '../../../../generated/prisma/client.js';
import { CurrentUser } from '../../../common/decorators/user.decorator.js';

// فرض بر این است که این فایل‌ها را در مرحله بعد می‌سازیم
import { PayrollEmployeeService } from '../services/payroll-employee.service';
import { FilterPayrollDto } from '../dto/filter-payroll.dto';

@ApiTags('Payroll - Employee')
@ApiBearerAuth()
@Roles(RoleType.EMPLOYEE)
@Controller('employee/payroll')
export class PayrollEmployeeController {
  constructor(private readonly payrollService: PayrollEmployeeService) {}

  @Get()
  @ApiOperation({ summary: 'مشاهده لیست فیش‌های حقوقی من' })
  async findMyPayrolls(
    @Query() filters: FilterPayrollDto,
    @CurrentUser() user: { id: number },
  ): Promise<Payroll[]> {
    return await this.payrollService.findMyPayrolls(user.id, filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'مشاهده جزئیات فیش حقوقی خاص' })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: { id: number }, // ارسال آیدی برای اطمینان از اینکه فیش مال خودش است
  ): Promise<Payroll> {
    return await this.payrollService.findOne(id, user.id);
  }
}
