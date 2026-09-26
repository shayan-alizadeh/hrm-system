import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { DepartmentEmployeeService } from '../services/department-employee.service.js';
// import { Department } from '../entities/department.entity';
import { ApiBearerAuth } from '@nestjs/swagger';
import { RoleType } from '../../../../generated/prisma/enums.js';
import { Roles } from '../../auth/decorators/roles.decorator.js';

/**
 * کنترلر مخصوص کارمندان برای مشاهده دپارتمان‌ها
 */
@ApiBearerAuth()
@Roles(RoleType.EMPLOYEE)
@Controller('employee/departments')
export class DepartmentEmployeeController {
  constructor(private readonly departmentsService: DepartmentEmployeeService) {}

  /** GET /employee/departments */
  @Get()
  async findAll() {
    return await this.departmentsService.findAll();
  }

  /** GET /employee/departments/:id */
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.departmentsService.findOne(id);
  }
}
