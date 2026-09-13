import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from '../../../modules/auth/decorators/roles.decorator.js';
import  { roleType } from '../../../../generated/prisma/enums.js';
import { AttendanceEmployeeService } from '../services/attendance-employee.service.js';
import { CheckInOutDto } from '../dto/check-in-out.dto.js';
import { User } from '../../../common/decorators/user.decorator.js';
import { FilterAttendanceDto } from '../dto/filter-attendance.dto.js';
import { attendances } from '../../../../generated/prisma/client.js';


@ApiBearerAuth()
@Roles(roleType.EMPLOYEE)
@Controller('employee/attendance')
export class AttendanceEmployeeController {
  constructor(private readonly attendanceService: AttendanceEmployeeService) {}

  @Post('check-in')
  async checkIn(
    @Body() dto: CheckInOutDto,
    @User() user: { id: number; role: string },
  ): Promise<attendances> {
    return await this.attendanceService.checkIn(user.id, dto.j_date, dto.notes);
  }

  @Post('check-out')
  async checkOut(
    @Body() dto: CheckInOutDto,
    @User() user: { id: number; role: string },
  ): Promise<attendances> {
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
  ): Promise<attendances[]> {
    return await this.attendanceService.findMyAttendance(user.id, filters);
  }
}
