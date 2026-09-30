import { Controller, Get, Param } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';

import { RoleType } from '../../../../generated/prisma/enums.js';
import { ParseIdPipe } from '../../../common/pipes/parse-id.pipe.js';
import { Roles } from '../../auth/decorators/roles.decorator.js';
import { DepartmentEmployeeService } from '../services/department-employee.service.js';

/**
 * مسیرهای مشاهده دپارتمان برای کارمندان.
 * احراز هویت و کنترل نقش توسط گاردهای سراسری انجام می‌شود.
 */
@ApiBearerAuth()
@Roles(RoleType.EMPLOYEE)
@Controller('employee/departments')
export class DepartmentEmployeeController {
  constructor(private readonly departmentsService: DepartmentEmployeeService) {}

  /** GET /api/v1/employee/departments */
  @Get()
  async findAll() {
    return this.departmentsService.findAll();
  }

  /** GET /api/v1/employee/departments/:id */
  @Get(':id')
  async findOne(@Param('id', ParseIdPipe) id: number) {
    return this.departmentsService.findOne(id);
  }
}
