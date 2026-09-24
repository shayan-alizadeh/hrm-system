import { PartialType } from '@nestjs/swagger';
import { CreateTaxRuleDto } from './create-tax-rule.dto.js';

export class UpdateTaxRuleDto extends PartialType(CreateTaxRuleDto) {}
