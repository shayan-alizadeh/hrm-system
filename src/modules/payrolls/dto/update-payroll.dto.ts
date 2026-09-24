import { PartialType } from '@nestjs/swagger';
import { CreatePayrollDto } from './create-payroll.dto.js';


export class UpdatePayrollDto extends PartialType(CreatePayrollDto) {}
