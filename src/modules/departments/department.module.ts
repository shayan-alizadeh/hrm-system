import { Module } from '@nestjs/common';
import { DepartmentsManagerController } from './controllers/department-manager.controller.js';
import { DepartmentsManagerService } from './services/department-manager.service.js';
import { DepartmentsEmployeeController } from './controllers/department-employee.controller.js';
import { DepartmentsEmployeeService } from './services/department-employee.service.js';

@Module({
  imports: [],
  controllers: [DepartmentsManagerController, DepartmentsEmployeeController],
  providers: [DepartmentsManagerService, DepartmentsEmployeeService],
})
export class DepartmentModule {}
