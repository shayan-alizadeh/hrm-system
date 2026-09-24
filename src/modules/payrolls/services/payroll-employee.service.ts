import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { FilterPayrollDto } from '../dto/filter-payroll.dto.js';

@Injectable()
export class PayrollEmployeeService {
  constructor(private readonly prisma: PrismaService) {}

  private serializePayroll(payroll: any) {
    if (!payroll) return null;
    return {
      ...payroll,
      baseSalary: Number(payroll.baseSalary),
      bonuses: Number(payroll.bonuses),
      deductions: Number(payroll.deductions),
      totalAmount: Number(payroll.totalAmount),
    };
  }

  async findMyPayrolls(userId: number, filters: FilterPayrollDto) {
    const payrolls = await this.prisma.payroll.findMany({
      where: {
        userId,
        ...(filters.payPeriod && { payPeriod: filters.payPeriod }),
        ...(filters.status && { status: filters.status }),
      },
      orderBy: { createdAt: 'desc' },
    });

    return payrolls.map((p) => this.serializePayroll(p));
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

    return this.serializePayroll(payroll);
  }
}
