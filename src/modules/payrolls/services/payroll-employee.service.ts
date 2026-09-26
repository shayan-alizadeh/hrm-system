import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { FilterPayrollDto } from '../dto/filter-payroll.dto.js';

@Injectable()
export class PayrollEmployeeService {
  constructor(private readonly prisma: PrismaService) {}

  // متد serializePayroll کاملاً حذف شد چون Float در جاوااسکریپت به صورت Number استاندارد خوانده می‌شود

  async findMyPayrolls(userId: number, filters: FilterPayrollDto) {
    return await this.prisma.payroll.findMany({
      where: {
        userId,
        // فیلترها بر اساس مدل جدید دیتابیس
        ...(filters.year && { year: filters.year }),
        ...(filters.month && { month: filters.month }),
        ...(filters.status && { status: filters.status }),
      },
      // مرتب‌سازی حرفه‌ای‌تر: به جای زمان ایجاد، بر اساس سال و ماه به صورت نزولی مرتب می‌کنیم
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });
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

    return payroll; // چون دیتا Float است، مستقیماً ریترن می‌شود
  }
}
