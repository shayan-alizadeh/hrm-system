import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../../../generated/prisma/client.js';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { CreatePayrollDto } from '../dto/create-payroll.dto.js';
import { UpdatePayrollDto } from '../dto/update-payroll.dto.js';
import { FilterPayrollDto } from '../dto/filter-payroll.dto.js';

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

  async update(id: number, dto: UpdatePayrollDto) {
    const payroll = await this.prisma.payrolls.findUnique({ where: { id } });

    if (!payroll) {
      throw new NotFoundException('فیش حقوقی یافت نشد');
    }

    const baseSalary = dto.baseSalary ?? payroll.baseSalary;
    const bonuses = dto.bonuses ?? payroll.bonuses;
    const deduction = dto.deductions ?? payroll.deduction;

    const totalAmount = baseSalary + bonuses - deduction;

    let paymentDate = payroll.paymentDate;

    if (dto.status === payrollStatus.PAID && !payroll.paymentDate) {
      paymentDate = new Date();
    }

    return await this.prisma.payrolls.update({
      where: {
        id,
      },
      data: {
        ...(dto.salaryPeriod !== undefined && {
          salaryPeriod: dto.salaryPeriod,
        }),

        ...(dto.baseSalary !== undefined && {
          baseSalary: dto.baseSalary,
        }),

        ...(dto.bonuses !== undefined && {
          bonuses: dto.bonuses,
        }),

        ...(dto.deductions !== undefined && {
          deduction: dto.deductions,
        }),

        ...(dto.status !== undefined && {
          status: dto.status,
        }),

        totalAmount,
        paymentDate,
      },
    });
  }

  async findAll(filters: FilterPayrollDto) {
    return await this.prisma.payrolls.findMany({
      where: {
        ...(filters.userId !== undefined && {
          userId: filters.userId,
        }),

        ...(filters.salaryPeriod !== undefined && {
          salaryPeriod: filters.salaryPeriod,
        }),

        ...(filters.status !== undefined && {
          status:
            filters.status === 'pending'
              ? payrollStatus.PENDING
              : payrollStatus.PAID,
        }),
      },

      include: {
        user: true,
      },

      orderBy: [
        {
          salaryPeriod: 'desc',
        },
        {
          createdAt: 'desc',
        },
      ],
    });
  }

  async findOne(id: number) {
    const payroll = await this.prisma.payrolls.findUnique({
      where: { id },
      include: {
        user: true,
      },
    });

    if (!payroll) {
      throw new NotFoundException('فیش حقوقی مد نظر شما یافت نشد');
    }

    return payroll;
  }

  async remove(id: number) {
    try {
      await this.prisma.payrolls.delete({
        where: { id },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('فیش حقوقی مد نظر شما یافت نشد');
      }

      throw error;
    }
  }
}
