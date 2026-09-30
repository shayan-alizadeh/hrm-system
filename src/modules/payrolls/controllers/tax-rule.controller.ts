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
import { CreateTaxRuleDto } from '../dto/create-tax-rule.dto.js';
import { FilterTaxRuleDto } from '../dto/filter-tax-rule.dto.js';
import { UpdateTaxRuleDto } from '../dto/update-tax-rule.dto.js';
import { TaxRuleService } from '../services/tax-rule.service.js';

@ApiTags('Tax Rules (Manager Only)')
@ApiBearerAuth()
@Roles(RoleType.MANAGER)
@Controller('manager/tax-rules')
export class TaxRuleController {
  constructor(private readonly taxRuleService: TaxRuleService) {}

  @Post()
  @ApiOperation({ summary: 'تعریف پله مالیاتی' })
  async create(@Body() dto: CreateTaxRuleDto) {
    return this.taxRuleService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'دریافت پله‌های مالیاتی' })
  async findAll(@Query() filters: FilterTaxRuleDto) {
    return this.taxRuleService.findAll(filters.year);
  }

  @Get(':id')
  @ApiOperation({ summary: 'دریافت جزئیات پله مالیاتی' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.taxRuleService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'ویرایش پله مالیاتی' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTaxRuleDto,
  ) {
    return this.taxRuleService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'حذف پله مالیاتی' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.taxRuleService.remove(id);

    return { message: 'پله مالیاتی با موفقیت حذف شد.' };
  }
}
