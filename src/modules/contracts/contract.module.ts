import { Module } from '@nestjs/common';
import {ContractEmployeeController} from './controllers/contract-employee.controller.js'
import {ContractManagerController} from './controllers/contract-manager.controller.js'
import { ContractService } from './services/contract.service.js';


@Module({
  imports: [],
  controllers: [ContractEmployeeController, ContractManagerController],
  providers: [ContractService],
  exports: [ContractService]
})
export class ContractModule {}