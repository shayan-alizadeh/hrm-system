import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../../prisma/prisma.service.js';
import { CreatePayrollDto } from '../dto/create-payroll.dto.js';

import { payrollStatus } from '../../../../generated/prisma/enums.js';

@Injectable()
export class PayrollManagerService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePayrollDto) {
    // بررسی وجود کاربر
    const user = await this.prisma.users.findUnique({
      where: {
        id: dto.userId,
      },
    });

    if (!user) {
      throw new NotFoundException('کاربر یافت نشد');
    }

    // بررسی اینکه برای این کاربر و این دوره قبلاً فیش ثبت نشده باشد
    const existing = await this.prisma.payrolls.findFirst({
      where: {
        userId: dto.userId,
        salaryPeriod: dto.salaryPeriod,
      },
    });

    if (existing) {
      throw new BadRequestException(
        'برای این دوره قبلا فیش حقوقی صادر شده است',
      );
    }

    // محاسبه مبالغ
    const bonuses = dto.bonuses || 0;
    const deduction = dto.deductions || 0;

    const totalAmount = dto.baseSalary + bonuses - deduction;

    // تاریخ پرداخت
    let paymentDate: Date | null = null;

    if (dto.status === payrollStatus.PAID) {
      paymentDate = new Date();
    }

    // ایجاد فیش حقوقی
    return await this.prisma.payrolls.create({
      data: {
        userId: dto.userId,

        salaryPeriod: dto.salaryPeriod,

        baseSalary: dto.baseSalary,
        bonuses,
        deduction,
        totalAmount,

        paymentDate,

        status: dto.status ?? payrollStatus.PENDING,

        notes: dto.notes ?? null,
      },
    });
  }
}
