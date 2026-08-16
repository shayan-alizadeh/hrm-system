import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { DepartmentsEmployeeService } from '../services/departments-employee.service.js';
// import { Department } from '../entities/department.entity';
import { ApiBearerAuth } from '@nestjs/swagger';
import { roleType } from '../../../../generated/prisma/enums.js';
import { Roles } from '../../../modules/auth/decorators/roles.decorator.js';

/**
 * کنترلر مخصوص کارمندان برای مشاهده دپارتمان‌ها
 */
@ApiBearerAuth()
@Roles(roleType.EMPLOYEE)
@Controller('employee/departments')
export class DepartmentsEmployeeController {
  constructor(
    private readonly departmentsService: DepartmentsEmployeeService,
  ) {}

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
