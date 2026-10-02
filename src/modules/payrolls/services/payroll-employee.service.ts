import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { FilterPayrollDto } from '../dto/filter-payroll.dto.js';
import type { Payroll } from '../../../../generated/prisma/client.js';

@Injectable()
export class PayrollEmployeeService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * به دلیل تغییر دیتابیس به نوع امن Decimal، خروجی Prisma برای فیلدهای پولی شیء Prisma.Decimal است.
   * برای جلوگیری از تبدیل شدن آن‌ها به String در فرانت‌اند، در این متد آن‌ها را به Number تبدیل می‌کنیم.
   */
  private mapPayroll(payroll: Payroll) {
    return {
      ...payroll,
      baseSalary: Number(payroll.baseSalary),
      totalAllowances: Number(payroll.totalAllowances),
      grossSalary: Number(payroll.grossSalary),
      taxDeduction: Number(payroll.taxDeduction),
      insuranceDeduction: Number(payroll.insuranceDeduction),
      unpaidLeaveDeduction: Number(payroll.unpaidLeaveDeduction),
      netSalary: Number(payroll.netSalary),
    };
  }

  async findMyPayrolls(userId: number, filters: FilterPayrollDto) {
    const payrolls = await this.prisma.payroll.findMany({
      where: {
        userId,
        ...(filters.year && { year: filters.year }),
        ...(filters.month && { month: filters.month }),
        ...(filters.status && { status: filters.status }),
      },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });

    return payrolls.map((p) => this.mapPayroll(p));
  }

  async findOne(id: number, userId: number) {
    const payroll = await this.prisma.payroll.findFirst({
      where: {
        id,
        userId, // این شرط حیاتی است تا کارمند نتواند فیش حقوقی بقیه را با حدس زدن ID ببیند
      },
    });

    if (!payroll) {
      throw new NotFoundException(
        'فیش حقوقی مورد نظر یافت نشد یا شما دسترسی به آن ندارید.',
      );
    }

    return this.mapPayroll(payroll);
  }
}
