import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { Roles } from '../../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard'; // گارد احراز هویت
import { RolesGuard } from '../../../common/guards/roles.guard'; // گارد بررسی نقش
import { RoleType } from '../../../../generated/prisma/enums.js'; // ایمپورت‌های استاندارد دیتابیس
import { Attendance } from '../../../../generated/prisma/client.js';
import { AttendanceEmployeeService } from '../services/attendance-employee.service.js';
import { CheckInOutDto } from '../dto/check-in-out.dto.js';
import { CurrentUser } from '../../../common/decorators/user.decorator.js';
import { FilterAttendanceDto } from '../dto/filter-attendance.dto.js';

@ApiTags('Attendance - Employee') // مرتب‌سازی در Swagger
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard) // ⚠️ اضافه شدن گاردهای امنیتی الزامی
@Roles(RoleType.EMPLOYEE)
@Controller('employee/attendance')
export class AttendanceEmployeeController {
  constructor(private readonly attendanceService: AttendanceEmployeeService) {}

  @Post('check-in')
  @ApiOperation({ summary: 'ثبت ساعت ورود (Check-in)' })
  async checkIn(
    @Body() dto: CheckInOutDto,
    @CurrentUser() user: { id: number; role: string },
  ): Promise<Attendance> {
    // تغییر j_date به attendanceDate بر اساس تغییرات دیتابیس
    return await this.attendanceService.checkIn(
      user.id,
      dto.attendanceDate,
      dto.notes,
    );
  }

  @Post('check-out')
  @ApiOperation({ summary: 'ثبت ساعت خروج (Check-out)' })
  async checkOut(
    @Body() dto: CheckInOutDto,
    @CurrentUser() user: { id: number; role: string },
  ): Promise<Attendance> {
    // تغییر j_date به attendanceDate
    return await this.attendanceService.checkOut(
      user.id,
      dto.attendanceDate,
      dto.notes,
    );
  }

  @Get()
  @ApiOperation({ summary: 'دریافت گزارش حضور و غیاب‌های من' })
  async findMyAttendance(
    @Query() filters: FilterAttendanceDto,
    @CurrentUser() user: { id: number },
  ): Promise<Attendance[]> {
    return await this.attendanceService.findMyAttendance(user.id, filters);
  }
}
