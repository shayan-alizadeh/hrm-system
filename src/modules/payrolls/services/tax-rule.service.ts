import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../../prisma/prisma.service.js';
import { CreateTaxRuleDto } from '../dto/create-tax-rule.dto.js';
import { UpdateTaxRuleDto } from '../dto/update-tax-rule.dto.js';
import {
  assertPayrollYear,
  assertValidTaxBands,
  rethrowRecordError,
  runSerializable,
} from '../utils/payroll.utils.js';

@Injectable()
export class TaxRuleService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * بررسی هم‌پوشانی و درج، داخل یک تراکنش انجام می‌شوند
   * تا دو درخواست هم‌زمان نتوانند پله‌های متداخل ثبت کنند.
   */
  async create(dto: CreateTaxRuleDto) {
    assertPayrollYear(dto.year);

    const candidate = {
      year: dto.year,
      minIncome: dto.minIncome,
      maxIncome: dto.maxIncome ?? null,
      percentage: dto.percentage,
    };

    return runSerializable(this.prisma, async (tx) => {
      const existingRules = await tx.taxRule.findMany({
        where: { year: candidate.year },
      });

      assertValidTaxBands([...existingRules, candidate]);

      return tx.taxRule.create({ data: candidate });
    });
  }

  async findAll(year?: number) {
    if (year !== undefined) {
      assertPayrollYear(year);
    }

    return this.prisma.taxRule.findMany({
      where: year === undefined ? {} : { year },
      orderBy: [{ year: 'desc' }, { minIncome: 'asc' }, { id: 'asc' }],
    });
  }

  async findOne(id: number) {
    const rule = await this.prisma.taxRule.findUnique({
      where: { id },
    });

    if (!rule) {
      throw new NotFoundException('پله مالیاتی یافت نشد.');
    }

    return rule;
  }

  /**
   * اعتبارسنجی روی وضعیت نهایی رکورد انجام می‌شود؛
   * در PATCH ممکن است فقط یکی از مرزهای درآمد تغییر کند.
   */
  async update(id: number, dto: UpdateTaxRuleDto) {
    if (
      dto.year === null ||
      dto.minIncome === null ||
      dto.percentage === null
    ) {
      throw new BadRequestException(
        'سال، کف درآمد و درصد مالیات نمی‌توانند null باشند.',
      );
    }

    return runSerializable(this.prisma, async (tx) => {
      const existing = await tx.taxRule.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new NotFoundException('پله مالیاتی یافت نشد.');
      }

      const candidate = {
        year: dto.year ?? existing.year,
        minIncome: dto.minIncome ?? existing.minIncome,
        percentage: dto.percentage ?? existing.percentage,
        // null به معنی پله بدون سقف است؛ undefined یعنی عدم تغییر.
        maxIncome:
          dto.maxIncome === undefined ? existing.maxIncome : dto.maxIncome,
      };

      assertPayrollYear(candidate.year);

      const otherRules = await tx.taxRule.findMany({
        where: {
          year: candidate.year,
          id: { not: id },
        },
      });

      assertValidTaxBands([...otherRules, candidate]);

      return tx.taxRule.update({
        where: { id },
        data: candidate,
      });
    });
  }

  async remove(id: number): Promise<void> {
    try {
      await this.prisma.taxRule.delete({ where: { id } });
    } catch (error: unknown) {
      rethrowRecordError(error, 'پله مالیاتی یافت نشد.');
    }
  }
}
