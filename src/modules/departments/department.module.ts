import { Module } from '@nestjs/common';
import { DepartmentsManagerController } from './controllers/departmants-manager.controller.js';
import { DepartmentsManagerService } from './services/departments-manager.service.js';

Module({
  imports: [],
  controllers: [DepartmentsManagerController],
  providers: [DepartmentsManagerService],
});
export class DepartmentModule {}
