import { Module } from '@nestjs/common';
import { DepartmentsManagerController } from './controllers/departmants-manager.controller.js';
import { DepartmentsManagerService } from './services/departments-manager.service.js';
import { DepartmentsEmployeeController } from './controllers/departmants-employee.controller.js';
import { DepartmentsEmployeeService } from './services/departments-employee.service.js';

@Module({
  imports: [],
  controllers: [DepartmentsManagerController, DepartmentsEmployeeController],
  providers: [DepartmentsManagerService, DepartmentsEmployeeService],
})
export class DepartmentModule {}
