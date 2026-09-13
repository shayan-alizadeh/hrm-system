import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from '../../../modules/auth/decorators/roles.decorator';
import { Role } from '../../../shared/enums/user-role.enum';
import { AttendanceEmployeeService } from '../services/attendance-employee.service.js';
import { CheckInOutDto } from '../dto/check-in-out.dto.js';
import { User } from '../../../common/decorators/user.decorator.js';
import { FilterAttendanceDto } from '../dto/filter-attendance.dto.js';
import { Attendance } from '../entities/attendance.entity';

@ApiBearerAuth()
@Roles(Role.EMPLOYEE)
@Controller('employee/attendance')
export class AttendanceEmployeeController {
  constructor(private readonly attendanceService: AttendanceEmployeeService) {}

  @Post('check-in')
  async checkIn(
    @Body() dto: CheckInOutDto,
    @User() user: { id: number; role: string },
  ): Promise<Attendance> {
    return await this.attendanceService.checkIn(user.id, dto.j_date, dto.notes);
  }

  @Post('check-out')
  async checkOut(
    @Body() dto: CheckInOutDto,
    @User() user: { id: number; role: string },
  ): Promise<Attendance> {
    return await this.attendanceService.checkOut(
      user.id,
      dto.j_date,
      dto.notes,
    );
  }

  @Get()
  async findMyAttendance(
    @Query() filters: FilterAttendanceDto,
    @User() user: { id: number },
  ): Promise<Attendance[]> {
    return await this.attendanceService.findMyAttendance(user.id, filters);
  }
}
