import { Module } from '@nestjs/common';
import { LeaveEmployeeController } from './controllers/leave-employee.controller.js';
import { LeaveManagerController } from './controllers/leave-manager.controller.js';
import { LeaveEmployeeService } from './services/leave-employee.service.js';
import { LeaveManagerService } from './services/leave-manager.service.js';

@Module({
  imports: [],
  controllers: [LeaveEmployeeController, LeaveManagerController],
  providers: [LeaveEmployeeService, LeaveManagerService],
})
export class LeaveModule {}
