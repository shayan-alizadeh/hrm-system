import { Module } from '@nestjs/common';
import { PayrollManagerController } from './controllers/payroll-manager.controller.js';
import { PayrollManagerService } from './services/payroll-manager.service.js';
import { PayrollEmployeeService } from './services/payroll-employee.service.js';
import { PayrollCalculatorService } from './services/payroll-calculator.service.js';
import { PayrollEmployeeController } from './controllers/payroll-employee.controller.js';
import { TaxRuleController } from './controllers/tax-rule.controller.js';
import { TaxRuleService } from './services/tax-rule.service.js';
import { ContractModule } from '../contracts/contract.module.js';

@Module({
  imports: [ContractModule],
  controllers: [PayrollManagerController,PayrollEmployeeController,TaxRuleController],
  providers: [PayrollManagerService,PayrollEmployeeService,PayrollCalculatorService,TaxRuleService],
})
export class PayrollModule {}
