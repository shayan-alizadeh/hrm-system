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
import { Roles } from '../../../common/decorators/roles.decorator';
import { RoleType } from '../../../../generated/prisma/enums.js';

import { HolidayService } from '../services/holiday.service.js';
import { CreateHolidayDto } from '../dto/create-holiday.dto.js';
import { UpdateHolidayDto } from '../dto/update-holiday.dto.js';

@ApiTags('Holidays (Manager Only)')
@ApiBearerAuth()
@Roles(RoleType.MANAGER)
@Controller('manager/holidays')
export class HolidayController {
  constructor(private readonly holidayService: HolidayService) {}

  @Post()
  @ApiOperation({ summary: 'ثبت یک تعطیلی جدید در تقویم سیستم' })
  async create(@Body() dto: CreateHolidayDto) {
    return await this.holidayService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'دریافت لیست تمام تعطیلات' })
  @ApiQuery({
    name: 'year',
    required: false,
    description: 'فیلتر بر اساس سال (مثلاً 1404)',
  })
  async findAll(@Query('year') year?: string) {
    return await this.holidayService.findAll(year);
  }

  @Get(':id')
  @ApiOperation({ summary: 'دریافت جزئیات یک تعطیلی خاص' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.holidayService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'ویرایش اطلاعات یک تعطیلی' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateHolidayDto,
  ) {
    return await this.holidayService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'حذف یک تعطیلی از تقویم' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return await this.holidayService.remove(id);
  }
}
