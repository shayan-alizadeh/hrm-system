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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { RoleType } from '../../../../generated/prisma/enums.js';
import { Roles } from '../../auth/decorators/roles.decorator.js';
import { ChangePayrollStatusDto } from '../dto/change-payroll-status.dto.js';
import { CreatePayrollDto } from '../dto/create-payroll.dto.js';
import { FilterPayrollDto } from '../dto/filter-payroll.dto.js';
import { PayrollManagerService } from '../services/payroll-manager.service.js';

@ApiTags('Payroll - Manager')
@ApiBearerAuth()
@Roles(RoleType.MANAGER)
@Controller('manager/payroll')
export class PayrollManagerController {
  constructor(private readonly payrollManagerService: PayrollManagerService) {}

  @Post()
  @ApiOperation({
    summary: 'صدور فیش حقوقی با احتساب قرارداد و مرخصی‌ها',
  })
  async create(@Body() dto: CreatePayrollDto) {
    return this.payrollManagerService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'دریافت فیش‌های حقوقی با فیلتر' })
  async findAll(@Query() filters: FilterPayrollDto) {
    return this.payrollManagerService.findAll(filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'دریافت جزئیات فیش حقوقی' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.payrollManagerService.findOne(id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'تغییر وضعیت فیش حقوقی' })
  async changeStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ChangePayrollStatusDto,
  ) {
    // DTO باعث می‌شود ValidationPipe واقعاً وضعیت را اعتبارسنجی کند.
    return this.payrollManagerService.changeStatus(id, dto.status);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'حذف فیش حقوقی' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.payrollManagerService.remove(id);

    return { message: 'فیش حقوقی با موفقیت حذف شد.' };
  }
}
