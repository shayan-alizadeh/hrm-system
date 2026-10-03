import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { Roles } from '../../auth/decorators/roles.decorator.js';
import { RoleType } from '../../../../generated/prisma/enums.js';
import type { Attendance } from '../../../../generated/prisma/client.js';
import { AttendanceEmployeeService } from '../services/attendance-employee.service.js';
import { CheckInOutDto } from '../dto/check-in-out.dto.js';
import { CurrentUser } from '../../../common/decorators/user.decorator.js';
import { FilterAttendanceDto } from '../dto/filter-attendance.dto.js';

// پیشنهاد: این اینترفیس در مسیر auth/interfaces تعریف و در پروژه ایمپورت شود
export interface IJwtPayload {
  id: number;
  role: string;
}

@ApiTags('Attendance - Employee') // مرتب‌سازی در Swagger
@ApiBearerAuth()
@Roles(RoleType.EMPLOYEE)
@Controller('employee/attendance')
export class AttendanceEmployeeController {
  constructor(private readonly attendanceService: AttendanceEmployeeService) {}

  @Post('check-in')
  @ApiOperation({ summary: 'ثبت ساعت ورود (Check-in)' })
  async checkIn(
    @Body() dto: CheckInOutDto,
    @CurrentUser() user: IJwtPayload,
  ): Promise<Attendance> {
    // کلمه کلیدی await حذف شد
    return this.attendanceService.checkIn(
      user.id,
      dto.attendanceDate,
      dto.notes,
    );
  }

  @Post('check-out')
  @ApiOperation({ summary: 'ثبت ساعت خروج (Check-out)' })
  async checkOut(
    @Body() dto: CheckInOutDto,
    @CurrentUser() user: IJwtPayload,
  ): Promise<Attendance> {
    return this.attendanceService.checkOut(
      user.id,
      dto.attendanceDate,
      dto.notes,
    );
  }

  @Get()
  @ApiOperation({ summary: 'دریافت گزارش حضور و غیاب‌های من' })
  async findMyAttendance(
    @Query() filters: FilterAttendanceDto,
    @CurrentUser() user: IJwtPayload,
  ): Promise<Attendance[]> {
    return this.attendanceService.findMyAttendance(user.id, filters);
  }
}
