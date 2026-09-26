import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { CreateTaxRuleDto } from '../dto/create-tax-rule.dto.js';
import { UpdateTaxRuleDto } from '../dto/update-tax-rule.dto.js';

@Injectable()
export class TaxRuleService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateTaxRuleDto) {
    return await this.prisma.taxRule.create({
      data: {
        year: dto.year,
        minIncome: dto.minIncome,
        maxIncome: dto.maxIncome ?? null,
        percentage: dto.percentage,
      },
    });
  }

  async findAll(year?: number) {
    return await this.prisma.taxRule.findMany({
      where: {
        ...(year && { year }),
      },
      orderBy: [
        { year: 'desc' },
        { minIncome: 'asc' }, // پله‌ها به ترتیب کف درآمد مرتب شوند
      ],
    });
  }

  async findOne(id: number) {
    const rule = await this.prisma.taxRule.findUnique({ where: { id } });

    if (!rule) {
      throw new NotFoundException('پله مالیاتی یافت نشد.');
    }

    return rule; // مستقیماً آبجکت را برمی‌گردانیم
  }

  async update(id: number, dto: UpdateTaxRuleDto) {
    const existing = await this.prisma.taxRule.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundException('پله مالیاتی یافت نشد.');
    }

    return await this.prisma.taxRule.update({
      where: { id },
      data: {
        year: dto.year,
        minIncome: dto.minIncome,
        // اگر maxIncome در DTO ارسال نشده بود، همان مقدار قبلی دیتابیس را نگه می‌داریم
        maxIncome:
          dto.maxIncome !== undefined ? dto.maxIncome : existing.maxIncome,
        percentage: dto.percentage,
      },
    });
  }

  async remove(id: number) {
    const existing = await this.prisma.taxRule.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundException('پله مالیاتی یافت نشد.');
    }

    await this.prisma.taxRule.delete({ where: { id } });

    return { success: true, message: 'پله مالیاتی با موفقیت حذف شد.' };
  }
}
