import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Prisma } from '../../../../generated/prisma/client.js';
import {
  ContractStatus,
  LeaveStatus,
  LeaveType,
  PayrollStatus,
} from '../../../../generated/prisma/enums.js';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { CreatePayrollDto } from '../dto/create-payroll.dto.js';
import { FilterPayrollDto } from '../dto/filter-payroll.dto.js';
import {
  assertJalaliDate,
  getPayrollPeriod,
  isPrismaError,
  nonNegativeDecimal,
  rethrowRecordError,
  runSerializable,
  toStoredNumber,
} from '../utils/payroll.utils.js';
import { PayrollCalculatorService } from './payroll-calculator.service.js';

@Injectable()
export class PayrollManagerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly calculatorService: PayrollCalculatorService,
  ) {}

  /**
   * صدور فیش برای یک ماه کامل.
   * موارد نیازمند تسهیم قرارداد یا مرخصی، تا تعیین قاعده دقیق رد می‌شوند.
   */
  async create(dto: CreatePayrollDto) {
    const period = getPayrollPeriod(dto.year, dto.month);

    if (
      !Number.isInteger(dto.userId) ||
      dto.userId < 1 ||
      dto.userId > 2_147_483_647
    ) {
      throw new BadRequestException('شناسه کاربر نامعتبر است.');
    }

    try {
      return await runSerializable(this.prisma, async (tx) => {
        const existing = await tx.payroll.findUnique({
          where: {
            userId_year_month: {
              userId: dto.userId,
              year: dto.year,
              month: dto.month,
            },
          },
          select: { id: true },
        });

        if (existing) {
          throw new ConflictException(
            'فیش حقوقی این کاربر برای ماه انتخاب‌شده قبلاً صادر شده است.',
          );
        }

        const user = await tx.user.findUnique({
          where: { id: dto.userId },
          select: { id: true },
        });

        if (!user) {
          throw new NotFoundException('کاربر یافت نشد.');
        }

        const activeContracts = await tx.contract.findMany({
          where: {
            userId: dto.userId,
            status: ContractStatus.ACTIVE,
          },
        });

        for (const contract of activeContracts) {
          assertJalaliDate(contract.startDate);
          assertJalaliDate(contract.endDate);

          if (contract.startDate > contract.endDate) {
            throw new BadRequestException('بازه قرارداد نامعتبر است.');
          }
        }

        const relevantContracts = activeContracts.filter(
          (contract) =>
            contract.startDate <= period.endDate &&
            contract.endDate >= period.startDate,
        );

        if (relevantContracts.length === 0) {
          throw new BadRequestException(
            'قرارداد فعال مرتبط با ماه انتخاب‌شده یافت نشد.',
          );
        }

        if (relevantContracts.length > 1) {
          throw new BadRequestException(
            'بیش از یک قرارداد فعال به این ماه مربوط است؛ محاسبه نیازمند تعیین سهم هر قرارداد است.',
          );
        }

        const contract = relevantContracts[0];

        if (
          contract.startDate > period.startDate ||
          contract.endDate < period.endDate
        ) {
          throw new BadRequestException(
            'قرارداد تمام ماه را پوشش نمی‌دهد؛ قاعده حقوق ماه ناقص باید مشخص شود.',
          );
        }

        const unpaidLeaves = await tx.leaveRequest.findMany({
          where: {
            userId: dto.userId,
            leaveType: LeaveType.UNPAID,
            status: LeaveStatus.APPROVED,
            startDate: { lte: period.endDate },
            endDate: { gte: period.startDate },
          },
          select: {
            startDate: true,
            endDate: true,
            totalDays: true,
          },
        });

        let unpaidDays = new Prisma.Decimal(0);

        for (const leave of unpaidLeaves) {
          assertJalaliDate(leave.startDate);
          assertJalaliDate(leave.endDate);

          if (leave.startDate > leave.endDate) {
            throw new BadRequestException('بازه مرخصی نامعتبر است.');
          }

          if (
            leave.startDate < period.startDate ||
            leave.endDate > period.endDate
          ) {
            throw new BadRequestException(
              'مرخصی بدون حقوق از مرز ماه عبور کرده است؛ سهم روزهای قابل کسر هر ماه باید مشخص شود.',
            );
          }

          unpaidDays = unpaidDays.plus(
            nonNegativeDecimal(leave.totalDays, 'تعداد روزهای مرخصی'),
          );
        }

        if (unpaidDays.greaterThan(period.daysInMonth)) {
          throw new BadRequestException(
            'جمع مرخصی بدون حقوق از تعداد روزهای ماه بیشتر است.',
          );
        }

        const baseSalary = nonNegativeDecimal(contract.baseSalary, 'حقوق پایه');
        const housing = nonNegativeDecimal(
          contract.housingAllowance,
          'حق مسکن',
        );
        const food = nonNegativeDecimal(contract.foodAllowance, 'بن کارگری');
        const child = nonNegativeDecimal(contract.childAllowance, 'حق اولاد');

        const totalAllowances = housing.plus(food).plus(child);
        const grossSalary = baseSalary.plus(totalAllowances);

        const unpaidLeaveDeduction = baseSalary
          .times(unpaidDays)
          .dividedBy(period.daysInMonth);

        // مبنای بیمه و مالیات نسخه قبلی حفظ شده است.
        const insuranceDeduction = this.calculatorService.calculateInsurance(
          baseSalary.plus(housing).plus(food),
        );

        const taxableIncome = grossSalary.minus(insuranceDeduction);
        const taxDeduction = await this.calculatorService.calculateTax(
          taxableIncome,
          dto.year,
          tx,
        );

        const netSalary = grossSalary
          .minus(unpaidLeaveDeduction)
          .minus(insuranceDeduction)
          .minus(taxDeduction);

        if (netSalary.isNegative()) {
          throw new BadRequestException(
            'مجموع کسورات از درآمد ناخالص بیشتر است.',
          );
        }

        return tx.payroll.create({
          data: {
            userId: dto.userId,
            year: dto.year,
            month: dto.month,
            baseSalary: toStoredNumber(baseSalary),
            totalAllowances: toStoredNumber(totalAllowances),
            grossSalary: toStoredNumber(grossSalary),
            taxDeduction,
            insuranceDeduction,
            unpaidLeaveDeduction: toStoredNumber(unpaidLeaveDeduction),
            netSalary: toStoredNumber(netSalary),
            status: PayrollStatus.PENDING,
          },
        });
      });
    } catch (error: unknown) {
      // قید یکتای دیتابیس، آخرین لایه جلوگیری از صدور تکراری است.
      if (isPrismaError(error, 'P2002')) {
        throw new ConflictException(
          'فیش حقوقی این کاربر برای ماه انتخاب‌شده قبلاً صادر شده است.',
        );
      }

      throw error;
    }
  }

  async findAll(filters: FilterPayrollDto) {
    return this.prisma.payroll.findMany({
      where: {
        ...(filters.userId !== undefined && { userId: filters.userId }),
        ...(filters.year !== undefined && { year: filters.year }),
        ...(filters.month !== undefined && { month: filters.month }),
        ...(filters.status !== undefined && { status: filters.status }),
      },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });
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

    if (!payroll) {
      throw new NotFoundException('فیش حقوقی یافت نشد.');
    }

    return payroll;
  }

  async remove(id: number): Promise<void> {
    try {
      await this.prisma.payroll.delete({ where: { id } });
    } catch (error: unknown) {
      rethrowRecordError(error, 'فیش حقوقی یافت نشد.');
    }
  }

  /**
   * بررسی وضعیت قبلی و ثبت وضعیت جدید باید اتمیک باشد.
   * بازگشت PAID به PENDING مطابق رفتار قبلی مجاز باقی مانده است.
   */
  async changeStatus(id: number, status: PayrollStatus) {
    if (status !== PayrollStatus.PENDING && status !== PayrollStatus.PAID) {
      throw new BadRequestException('وضعیت فیش حقوقی نامعتبر است.');
    }

    return runSerializable(this.prisma, async (tx) => {
      const payroll = await tx.payroll.findUnique({
        where: { id },
      });

      if (!payroll) {
        throw new NotFoundException('فیش حقوقی یافت نشد.');
      }

      if (payroll.status === status) {
        throw new BadRequestException(
          'فیش حقوقی از قبل در وضعیت درخواستی قرار دارد.',
        );
      }

      return tx.payroll.update({
        where: { id },
        data: {
          status,
          // این زمان، زمان ثبت وضعیت پرداخت در سامانه است.
          paymentDate: status === PayrollStatus.PAID ? new Date() : null,
        },
      });
    });
  }
}
