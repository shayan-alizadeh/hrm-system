import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { DepartmentsEmployeeService } from '../services/departments-employee.service';
// import { Department } from '../entities/department.entity';
// import { ApiBearerAuth } from '@nestjs/swagger';
// import { Role } from '../../../shared/enums/user-role.enum';
// import { Roles } from '../../../modules/auth/decorators/roles.decorator';

/**
 * کنترلر مخصوص کارمندان برای مشاهده دپارتمان‌ها
 */
@ApiBearerAuth()
@Roles(Role.EMPLOYEE)
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
