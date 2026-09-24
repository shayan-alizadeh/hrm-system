import { Module } from '@nestjs/common';
import {LeavesEmployeeController} from './controllers/leaves-employee.controller.js'
import {LeavesManagerController} from './controllers/leaves-manager.controller.js'
import {LeavesEmployeeService} from './services/leaves-employee.service.js'
import {LeavesManagerService} from './services/leaves-manager.service.js'

@Module({
  imports: [],
  controllers: [LeavesEmployeeController, LeavesManagerController],
  providers: [LeavesEmployeeService, LeavesManagerService],
})
export class LeaveModule {}
