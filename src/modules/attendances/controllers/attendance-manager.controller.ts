import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import type { Attendance } from '../../../../generated/prisma/client.js';
import { RoleType } from '../../../../generated/prisma/enums.js';
import { ParseIdPipe } from '../../../common/pipes/parse-id.pipe.js';
import { Roles } from '../../auth/decorators/roles.decorator.js';
import { FilterAttendanceDto } from '../dto/filter-attendance.dto.js';
import { UpdateAttendanceDto } from '../dto/update-attendance.dto.js';
import { AttendanceManagerService } from '../services/attendance-manager.service.js';

/**
 * مدیریت حضور و غیاب توسط مدیر.
 * احراز هویت و بررسی نقش توسط گاردهای سراسری انجام می‌شود.
 */
@ApiTags('Attendance - Manager')
@ApiBearerAuth()
@Roles(RoleType.MANAGER)
@Controller('manager/attendance')
export class AttendanceManagerController {
  constructor(
    private readonly attendanceManagerService: AttendanceManagerService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'مشاهده گزارش حضور و غیاب کارکنان با فیلتر',
  })
  async findAll(@Query() filters: FilterAttendanceDto) {
    // تایپ استنباط‌شده، اطلاعات user موجود در خروجی سرویس را نیز حفظ می‌کند.
    return this.attendanceManagerService.findAll(filters);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'مشاهده جزئیات رکورد حضور و غیاب',
  })
  async findOne(@Param('id', ParseIdPipe) id: number) {
    return this.attendanceManagerService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'اصلاح دستی ساعت‌ها یا افزودن یادداشت مدیر',
  })
  async update(
    @Param('id', ParseIdPipe) id: number,
    @Body() dto: UpdateAttendanceDto,
  ): Promise<Attendance> {
    return this.attendanceManagerService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'حذف رکورد حضور و غیاب',
  })
  async remove(
    @Param('id', ParseIdPipe) id: number,
  ): Promise<{ success: boolean; message: string }> {
    await this.attendanceManagerService.remove(id);

    return {
      success: true,
      message: 'رکورد حضور و غیاب با موفقیت حذف شد',
    };
  }
}
