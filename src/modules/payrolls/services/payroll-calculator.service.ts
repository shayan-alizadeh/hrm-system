import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';

@Injectable()
export class PayrollCalculatorService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * محاسبه داینامیک مالیات پلکانی با اتصال به دیتابیس
   */
  async calculateTax(taxableIncome: number, year: number): Promise<number> {
    // ۱. دریافت قوانین مالیاتی آن سال (مرتب شده از کف به سقف)
    const rules = await this.prisma.taxRule.findMany({
      where: { year },
      orderBy: { minIncome: 'asc' },
    });

    if (!rules || rules.length === 0) {
      throw new BadRequestException(
        `قوانین مالیاتی برای سال ${year} هنوز در سیستم تعریف نشده است. لطفاً ابتدا پله‌های مالیاتی را وارد کنید.`,
      );
    }

    let totalTax = 0;

    // ۲. الگوریتم محاسبه پلکانی
    for (const rule of rules) {
      // تبدیل BigInt دیتابیس به Number برای محاسبات ریاضی
      const minIncome = Number(rule.minIncome);

      // آیا درآمد شخص به این پله می‌رسد؟
      if (taxableIncome > minIncome) {
        // اگر این پله سقف داشت، مینیممِ (درآمد شخص یا سقف پله) را می‌گیریم
        // اگر سقف نداشت (null)، یعنی تا بی‌نهایت، پس کل درآمد را مبنا قرار می‌دهیم
        const maxLimit = rule.maxIncome
          ? Number(rule.maxIncome)
          : taxableIncome;
        const upperLimit = Math.min(taxableIncome, maxLimit);

        // مبلغی که در این پله خاص مشمول مالیات می‌شود
        const applicableIncome = upperLimit - minIncome;

        if (applicableIncome > 0) {
          // محاسبه مالیات این پله و اضافه کردن به جمع کل
          totalTax += applicableIncome * (rule.percentage / 100);
        }
      }
    }

    return Math.floor(totalTax); // حذف اعشار ریالی
  }

  /**
   * محاسبه حق بیمه سهم کارمند (۷ درصد)
   */
  calculateInsurance(baseSalary: number): number {
    return Math.floor(baseSalary * 0.07);
  }
}
