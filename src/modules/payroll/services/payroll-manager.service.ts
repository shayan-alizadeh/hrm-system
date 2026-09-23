import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { CreatePayrollDto } from '../dto/create-payroll.dto.js';
import { UpdatePayrollDto } from '../dto/update-payroll.dto.js';
import { FilterPayrollDto } from '../dto/filter-payroll.dto.js';
import { PayrollStatus } from '../../../../generated/prisma/enums.js';

@Injectable()
export class PayrollManagerService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * متد کمکی برای تبدیل BigInt به Number جهت جلوگیری از کرش شدن JSON
   */
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

  async create(dto: CreatePayrollDto) {
    // ۱. بررسی اینکه برای این کاربر در این ماه فیش تکراری صادر نشود
    const existingPayroll = await this.prisma.payroll.findFirst({
      where: {
        userId: dto.userId,
        payPeriod: dto.payPeriod, // فرض بر این است که در DTO به payPeriod تغییر نام دادی
      },
    });

    if (existingPayroll) {
      throw new BadRequestException(
        'برای این کاربر در این دوره قبلاً فیش حقوقی صادر شده است.',
      );
    }

    // ۲. محاسبه مبلغ کل (Total Amount)
    const bonuses = dto.bonuses || 0;
    const deductions = dto.deductions || 0;
    const totalAmount = dto.baseSalary + bonuses - deductions;

    // ۳. ایجاد رکورد در دیتابیس
    const newPayroll = await this.prisma.payroll.create({
      data: {
        userId: dto.userId,
        payPeriod: dto.payPeriod,
        baseSalary: dto.baseSalary,
        bonuses,
        deductions,
        totalAmount,
        status: dto.status || PayrollStatus.PENDING,
        notes: dto.notes,
        // اگر وضعیت پرداخت شده بود، تاریخ پرداخت امروز ثبت شود
        ...(dto.status === PayrollStatus.PAID && { paymentDate: new Date() }),
      },
    });

    return this.serializePayroll(newPayroll);
  }

  async findAll(filters: FilterPayrollDto) {
    const payrolls = await this.prisma.payroll.findMany({
      where: {
        ...(filters.userId && { userId: filters.userId }),
        ...(filters.payPeriod && { payPeriod: filters.payPeriod }),
        ...(filters.status && { status: filters.status }),
      },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // مپ کردن تمام آرایه برای تبدیل BigIntها
    return payrolls.map((p) => this.serializePayroll(p));
  }

  async findOne(id: number) {
    const payroll = await this.prisma.payroll.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    if (!payroll) throw new NotFoundException('فیش حقوقی یافت نشد.');
    return this.serializePayroll(payroll);
  }

  async update(id: number, dto: UpdatePayrollDto) {
    const existing = await this.prisma.payroll.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('فیش حقوقی یافت نشد.');

    // محاسبه مجدد مبلغ کل در صورت تغییر مبالغ پایه، پاداش یا کسورات
    const baseSalary = dto.baseSalary ?? Number(existing.baseSalary);
    const bonuses = dto.bonuses ?? Number(existing.bonuses);
    const deductions = dto.deductions ?? Number(existing.deductions);
    const totalAmount = baseSalary + bonuses - deductions;

    let paymentDate = existing.paymentDate;
    if (
      dto.status === PayrollStatus.PAID &&
      existing.status !== PayrollStatus.PAID
    ) {
      paymentDate = new Date(); // تغییر وضعیت به پرداخت‌شده
    } else if (dto.status === PayrollStatus.PENDING) {
      paymentDate = null; // برگشت به حالت در انتظار
    }

    const updated = await this.prisma.payroll.update({
      where: { id },
      data: {
        ...dto,
        totalAmount,
        paymentDate,
      },
    });

    return this.serializePayroll(updated);
  }

  async remove(id: number) {
    const existing = await this.prisma.payroll.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('فیش حقوقی یافت نشد.');

    await this.prisma.payroll.delete({ where: { id } });
  }
}
