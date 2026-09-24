import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { CreateTaxRuleDto } from '../dto/create-tax-rule.dto.js';
import { UpdateTaxRuleDto } from '../dto/update-tax-rule.dto.js';

@Injectable()
export class TaxRuleService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * تبدیل BigInt به Number برای جلوگیری از کرش شدن خروجی JSON
   */
  private serializeTaxRule(rule: any) {
    if (!rule) return null;
    return {
      ...rule,
      minIncome: Number(rule.minIncome),
      maxIncome: rule.maxIncome !== null ? Number(rule.maxIncome) : null,
    };
  }

  async create(dto: CreateTaxRuleDto) {
    const newRule = await this.prisma.taxRule.create({
      data: {
        year: dto.year,
        minIncome: dto.minIncome,
        maxIncome: dto.maxIncome ?? null,
        percentage: dto.percentage,
      },
    });
    return this.serializeTaxRule(newRule);
  }

  async findAll(year?: number) {
    const rules = await this.prisma.taxRule.findMany({
      where: {
        ...(year && { year }),
      },
      orderBy: [
        { year: 'desc' },
        { minIncome: 'asc' }, // پله‌ها به ترتیب کف درآمد مرتب شوند
      ],
    });
    return rules.map((r) => this.serializeTaxRule(r));
  }

  async findOne(id: number) {
    const rule = await this.prisma.taxRule.findUnique({ where: { id } });
    if (!rule) throw new NotFoundException('پله مالیاتی یافت نشد.');
    return this.serializeTaxRule(rule);
  }

  async update(id: number, dto: UpdateTaxRuleDto) {
    const existing = await this.prisma.taxRule.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('پله مالیاتی یافت نشد.');

    const updated = await this.prisma.taxRule.update({
      where: { id },
      data: {
        year: dto.year,
        minIncome: dto.minIncome,
        maxIncome:
          dto.maxIncome !== undefined ? dto.maxIncome : existing.maxIncome,
        percentage: dto.percentage,
      },
    });
    return this.serializeTaxRule(updated);
  }

  async remove(id: number) {
    const existing = await this.prisma.taxRule.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('پله مالیاتی یافت نشد.');

    await this.prisma.taxRule.delete({ where: { id } });
  }
}
