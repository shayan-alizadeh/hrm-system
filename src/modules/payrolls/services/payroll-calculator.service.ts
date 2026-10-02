import { BadRequestException, Injectable } from '@nestjs/common';

import { Prisma } from '../../../../generated/prisma/client.js';
import { PrismaService } from '../../../prisma/prisma.service.js';
import {
  assertPayrollYear,
  assertValidTaxBands,
  nonNegativeDecimal,
  toStoredNumber,
} from '../utils/payroll.utils.js';

@Injectable()
export class PayrollCalculatorService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * مالیات پلکانی را بر مبنای قواعد ثبت‌شده محاسبه می‌کند.
   * در زمان صدور فیش، client باید همان کلاینت تراکنش صدور باشد.
   */
  async calculateTax(
    taxableIncome: number | Prisma.Decimal,
    year: number,
    client: Pick<Prisma.TransactionClient, 'taxRule'> = this.prisma,
  ): Promise<number> {
    assertPayrollYear(year);
    const income = nonNegativeDecimal(taxableIncome, 'درآمد مشمول مالیات');

    const rules = await client.taxRule.findMany({
      where: { year },
      orderBy: { minIncome: 'asc' },
    });

    if (rules.length === 0) {
      throw new BadRequestException(
        `قوانین مالیاتی سال ${year} تعریف نشده است.`,
      );
    }

    assertValidTaxBands(rules);

    let totalTax = new Prisma.Decimal(0);

    for (const rule of rules) {
      const minimum = new Prisma.Decimal(rule.minIncome);

      if (income.lessThanOrEqualTo(minimum)) {
        break;
      }

      const upperLimit =
        rule.maxIncome === null
          ? income
          : Prisma.Decimal.min(income, rule.maxIncome);

      const applicableIncome = upperLimit.minus(minimum);

      totalTax = totalTax.plus(
        applicableIncome.times(rule.percentage).dividedBy(100),
      );
    }

    // سیاست گرد کردن قبلی حفظ شده است: حذف اعشار پس از جمع تمام پله‌ها.
    return toStoredNumber(totalTax.floor());
  }

  /**
   * نرخ ۷ درصد، سیاست فعلی برنامه است.
   * تعیین اقلام مشمول بیمه بر عهده منطق صدور فیش است.
   */
  calculateInsurance(insuranceSubjectAmount: number | Prisma.Decimal): number {
    const amount = nonNegativeDecimal(
      insuranceSubjectAmount,
      'مبلغ مشمول بیمه',
    );

    return toStoredNumber(amount.times('0.07').floor());
  }
}
