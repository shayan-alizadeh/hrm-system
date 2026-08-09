import { Module } from '@nestjs/common';
import { DepartmentsManagerController } from './controllers/departmants-manager.controller';
import { DepartmentsManagerService } from './services/departments-manager.service';

Module({
  imports: [],
  controllers: [DepartmentsManagerController],
  providers: [DepartmentsManagerService],
});
export class DepartmentModule {}
