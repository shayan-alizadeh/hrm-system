import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { Roles } from '../../auth/decorators/roles.decorator.js';
import {
  RoleType,
  PayrollStatus,
} from '../../../../generated/prisma/client.js';

import { PayrollManagerService } from '../services/payroll-manager.service.js';
import { CreatePayrollDto } from '../dto/create-payroll.dto.js';
import { FilterPayrollDto } from '../dto/filter-payroll.dto.js';

@ApiTags('Payroll - Manager')
@ApiBearerAuth()
@Roles(RoleType.MANAGER)
@Controller('manager/payroll')
export class PayrollManagerController {
  constructor(private readonly payrollManagerService: PayrollManagerService) {}

  @Post()
  @ApiOperation({
    summary: 'صدور هوشمند فیش حقوقی با احتساب قرارداد و مرخصی‌ها',
  })
  async create(@Body() dto: CreatePayrollDto) {
    return await this.payrollManagerService.create(dto);
  }

  @Get()
  @ApiOperation({
    summary: 'دریافت لیست تمام فیش‌های حقوقی صادر شده (با فیلتر)',
  })
  async findAll(@Query() filters: FilterPayrollDto) {
    return await this.payrollManagerService.findAll(filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'دریافت جزئیات کامل یک فیش حقوقی' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.payrollManagerService.findOne(id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'تغییر وضعیت فیش حقوقی (مثلاً به پرداخت‌‌شده)' })
  async changeStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: PayrollStatus, // فرض بر این است که وضعیت در بادی ارسال می‌شود
  ) {
    return await this.payrollManagerService.changeStatus(id, status);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'حذف یک فیش حقوقی' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return await this.payrollManagerService.remove(id);
  }
}
