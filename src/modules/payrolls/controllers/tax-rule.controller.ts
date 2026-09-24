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
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';
import { Roles } from '../../auth/decorators/roles.decorator.js';
import { RoleType } from '../../../../generated/prisma/enums.js';

import { TaxRuleService } from '../services/tax-rule.service.js';
import { CreateTaxRuleDto } from '../dto/create-tax-rule.dto.js';
import { UpdateTaxRuleDto } from '../dto/update-tax-rule.dto.js';

@ApiTags('Tax Rules (Manager Only)')
@ApiBearerAuth()
@Roles(RoleType.MANAGER)
@Controller('manager/tax-rules')
export class TaxRuleController {
  constructor(private readonly taxRuleService: TaxRuleService) {}

  @Post()
  @ApiOperation({ summary: 'تعریف یک پله مالیاتی جدید' })
  async create(@Body() dto: CreateTaxRuleDto) {
    return await this.taxRuleService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'دریافت لیست تمام پله‌های مالیاتی' })
  @ApiQuery({
    name: 'year',
    required: false,
    description: 'فیلتر بر اساس سال (مثلاً 1404)',
  })
  async findAll(@Query('year') year?: string) {
    // تبدیل کوئری استرینگ به عدد (در صورت وجود)
    const filterYear = year ? parseInt(year, 10) : undefined;
    return await this.taxRuleService.findAll(filterYear);
  }

  @Get(':id')
  @ApiOperation({ summary: 'دریافت جزئیات یک پله مالیاتی خاص' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.taxRuleService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'ویرایش یک پله مالیاتی' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTaxRuleDto,
  ) {
    return await this.taxRuleService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'حذف یک پله مالیاتی' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.taxRuleService.remove(id);
    return { success: true, message: 'پله مالیاتی با موفقیت حذف شد' };
  }
}
