import { Module } from '@nestjs/common';
import { DepartmentManagerController } from './controllers/department-manager.controller.js';
import { DepartmentManagerService } from './services/department-manager.service.js';
import { DepartmentEmployeeController } from './controllers/department-employee.controller.js';
import { DepartmentEmployeeService } from './services/department-employee.service.js';

@Module({
  imports: [],
  controllers: [DepartmentManagerController, DepartmentEmployeeController],
  providers: [DepartmentManagerService, DepartmentEmployeeService],
})
export class DepartmentModule {}
