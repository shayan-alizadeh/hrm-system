import { Module } from '@nestjs/common';
import { PayrollManagerController } from './controllers/payroll-manager.controller.js';
import { PayrollManagerService } from './services/payroll-manager.service.js';
import { PayrollEmployeeService } from './services/payroll-employee.service.js';
import { PayrollCalculatorService } from './services/payroll-calculator.service.js';
import { PayrollEmployeeController } from './controllers/payroll-employee.controller.js';

@Module({
  imports: [],
  controllers: [PayrollManagerController,PayrollEmployeeController],
  providers: [PayrollManagerService,PayrollEmployeeService,PayrollCalculatorService],
})
export class PayrollModule {}
