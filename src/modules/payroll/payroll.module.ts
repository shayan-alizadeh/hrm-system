import { Module } from '@nestjs/common';
import { PayrollManagerController } from './controllers/payroll-manager.controller.js';
import { PayrollManagerService } from './services/payroll-manager.service.js';

@Module({
  imports: [],
  controllers: [PayrollManagerController],
  providers: [PayrollManagerService],
})
export class PayrollModule {}
