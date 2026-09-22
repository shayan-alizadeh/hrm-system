import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { Roles } from '../../auth/decorators/roles.decorator.js';
import { RoleType } from '../../../../generated/prisma/enums.js';
import { Attendance } from '../../../../generated/prisma/client.js';
import { AttendanceManagerService } from '../services/attendance-manager.service';

// ایمپورت DTOهایی که برای این بخش نیاز داری
import { FilterAttendanceDto } from '../dto/filter-attendance.dto.js';
import { UpdateAttendanceDto } from '../dto/update-attendance.dto.js';

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
    summary: 'مشاهده گزارش حضور و غیاب تمام کارمندان (با فیلتر)',
  })
  async findAll(@Query() filters: FilterAttendanceDto): Promise<Attendance[]> {
    // مدیر می‌تواند لیست حضور و غیاب همه را ببیند و مثلاً روی یک userId خاص فیلتر کند
    return await this.attendanceManagerService.findAll(filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'مشاهده جزئیات یک رکورد حضور و غیاب خاص' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Attendance> {
    return await this.attendanceManagerService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'اصلاح دستی رکورد حضور و غیاب (مثلا ثبت ساعت خروج فراموش شده)',
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAttendanceDto,
  ): Promise<Attendance> {
    return await this.attendanceManagerService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'حذف یک رکورد حضور و غیاب نامعتبر' })
  async remove(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ success: boolean; message: string }> {
    await this.attendanceManagerService.remove(id);
    return { success: true, message: 'رکورد حضور و غیاب با موفقیت حذف شد' };
  }
}
