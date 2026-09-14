import { Module } from '@nestjs/common';
import { PayrollManagerController } from './controllers/payroll-manager.controller';
import { PayrollManagerService } from './services/payroll-manager.service';

@Module({
  imports: [],
  controllers: [PayrollManagerController],
  providers: [PayrollManagerService],
})
export class PayrollModule {}
