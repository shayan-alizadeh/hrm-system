import { Module } from '@nestjs/common';
import { AttendanceManagerController } from './controllers/attendance-manager.controller.js';
import { AttendanceEmployeeController } from './controllers/attendance-employee.controller.js';
import { AttendanceManagerService } from './services/attendance-manager.service.js';
import { AttendanceEmployeeService } from './services/attendance-employee.service.js';

@Module({
  imports: [],
  controllers: [
    AttendanceManagerController,
    AttendanceEmployeeController,
  ],
  providers: [
    AttendanceManagerService,
    AttendanceEmployeeService,
  ],
})
export class AttendanceModule {}
