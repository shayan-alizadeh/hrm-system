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
import { RoleType } from '../../../../generated/prisma/enums.js';
import { Payroll } from '../../../../generated/prisma/client.js';
import { PayrollManagerService } from '../services/payroll-manager.service';
import { CreatePayrollDto } from '../dto/create-payroll.dto';
import { UpdatePayrollDto } from '../dto/update-payroll.dto';
import { FilterPayrollDto } from '../dto/filter-payroll.dto';

@ApiTags('Payroll - Manager')
@ApiBearerAuth()
@Roles(RoleType.MANAGER)
@Controller('manager/payroll')
export class PayrollManagerController {
  constructor(private readonly payrollService: PayrollManagerService) {}

  @Post()
  @ApiOperation({ summary: 'محاسبه و صدور فیش حقوقی جدید برای کارمند' })
  async create(@Body() dto: CreatePayrollDto): Promise<Payroll> {
    // این روت می‌تواند حقوق را بر اساس ترددها محاسبه کند یا مقادیر دستی بگیرد
    return await this.payrollService.create(dto);
  }

  @Get()
  @ApiOperation({
    summary: 'لیست تمام فیش‌های حقوقی صادر شده (با قابلیت فیلتر)',
  })
  async findAll(@Query() filters: FilterPayrollDto): Promise<Payroll[]> {
    return await this.payrollService.findAll(filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'مشاهده جزئیات یک فیش حقوقی' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Payroll> {
    return await this.payrollService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'اصلاح دستی مبالغ فیش حقوقی' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePayrollDto,
  ): Promise<Payroll> {
    return await this.payrollService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'حذف/ابطال یک فیش حقوقی' })
  async remove(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ success: boolean; message: string }> {
    await this.payrollService.remove(id);
    return { success: true, message: 'فیش حقوقی با موفقیت حذف شد' };
  }
}
