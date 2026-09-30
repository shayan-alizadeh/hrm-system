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
import { CreateHolidayDto } from '../dto/create-holiday.dto.js';
import { FilterHolidaysDto } from '../dto/filter-holidays.dto.js';
import { UpdateHolidayDto } from '../dto/update-holiday.dto.js';
import { HolidayService } from '../services/holiday.service.js';

@ApiTags('Holidays (Manager Only)')
@ApiBearerAuth()
@Roles(RoleType.MANAGER)
@Controller('manager/holidays')
export class HolidayController {
  constructor(private readonly holidayService: HolidayService) {}

  @Post()
  @ApiOperation({ summary: 'ثبت تعطیلی در تقویم سیستم' })
  async create(@Body() dto: CreateHolidayDto) {
    return this.holidayService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'دریافت تعطیلات با فیلتر سال' })
  async findAll(@Query() filters: FilterHolidaysDto) {
    return this.holidayService.findAll(filters.year);
  }

  @Get(':id')
  @ApiOperation({ summary: 'دریافت جزئیات تعطیلی' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.holidayService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'ویرایش تعطیلی' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateHolidayDto,
  ) {
    return this.holidayService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'حذف تعطیلی' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.holidayService.remove(id);
  }
}
