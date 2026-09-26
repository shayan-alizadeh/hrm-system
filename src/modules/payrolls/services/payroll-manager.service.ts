import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { CreatePayrollDto } from '../dto/create-payroll.dto.js'; // DTO جدید (فقط شامل userId, year, month)
import { UpdatePayrollDto } from '../dto/update-payroll.dto.js';
import { FilterPayrollDto } from '../dto/filter-payroll.dto.js';
import {
  PayrollStatus,
  LeaveStatus,
  LeaveType,
} from '../../../../generated/prisma/client.js';

// سرویس‌های خارجی که برای هوشمندسازی نیاز داریم
import { ContractService } from '../../contracts/services/contract.service.js';
import { PayrollCalculatorService } from './payroll-calculator.service.js';

@Injectable()
export class PayrollManagerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly calculatorService: PayrollCalculatorService,
    private readonly contractsService: ContractService,
  ) {}

  /**
   * صدور فیش حقوقی هوشمند با اتصال به ماژول‌های قرارداد و مرخصی
   */
  async create(dto: CreatePayrollDto) {
    // ۱. جلوگیری از صدور فیش تکراری برای این کارمند در این ماه و سال خاص
    const existingPayroll = await this.prisma.payroll.findUnique({
      where: {
        userId_year_month: {
          userId: dto.userId,
          year: dto.year,
          month: dto.month,
        },
      },
    });

    if (existingPayroll) {
      throw new ConflictException(
        `فیش حقوقی ماه ${dto.month} سال ${dto.year} قبلاً برای این کارمند صادر شده است.`,
      );
    }

    // ۲. دریافت قرارداد "فعال" کارمند برای استخراج پایه حقوق و مزایا
    const contract = await this.contractsService.getActiveContractByUserId(
      dto.userId,
    );

    // ۳. محاسبه ارزش ریالی یک روز کاری
    // ماه‌های ۱ تا ۶ = ۳۱ روز، ماه‌های ۷ تا ۱۱ = ۳۰ روز، اسفند = ۲۹ روز (در این پروژه ساده‌سازی شده است)
    const daysInMonth = dto.month <= 6 ? 31 : dto.month === 12 ? 29 : 30;
    const dailyBaseRate = contract.baseSalary / daysInMonth;

    // ۴. استخراج مرخصی‌های بدون حقوق تایید شده در همین ماه از جدول LeaveRequest
    const monthStr = dto.month.toString().padStart(2, '0');
    const yearMonthPrefix = `${dto.year}/${monthStr}`; // مثلا "1404/08"

    const unpaidLeavesThisMonth = await this.prisma.leaveRequest.findMany({
      where: {
        userId: dto.userId,
        leaveType: LeaveType.UNPAID,
        status: LeaveStatus.APPROVED,
        startDate: { startsWith: yearMonthPrefix },
      },
    });

    // جمع کل روزهای مرخصی بدون حقوق در این ماه و محاسبه مبلغ کسر آن
    const unpaidLeaveDays = unpaidLeavesThisMonth.reduce(
      (sum, req) => sum + req.totalDays,
      0,
    );
    const unpaidLeaveDeduction = unpaidLeaveDays * dailyBaseRate;

    // ۵. تجمیع درآمدهای ناخالص طبق قرارداد (Gross Salary)
    const totalAllowances =
      contract.housingAllowance +
      contract.foodAllowance +
      contract.childAllowance;
    const grossSalary = contract.baseSalary + totalAllowances;

    // ۶. محاسبه حق بیمه سهم کارمند (طبق قانون، حق اولاد معمولاً معاف از بیمه است)
    const insuranceSubjectAmount =
      contract.baseSalary + contract.housingAllowance + contract.foodAllowance;
    const insuranceDeduction = this.calculatorService.calculateInsurance(
      insuranceSubjectAmount,
    );

    // ۷. محاسبه مالیات داینامیک
    // درآمد مشمول مالیات: درآمدهای ناخالص منهای حق بیمه
    const taxableIncome = grossSalary - insuranceDeduction;
    const taxDeduction = await this.calculatorService.calculateTax(
      taxableIncome,
      dto.year,
    );

    // ۸. محاسبه نهایی پرداختی خالص (Net Salary)
    const totalDeductions =
      unpaidLeaveDeduction + insuranceDeduction + taxDeduction;
    const netSalary = grossSalary - totalDeductions;

    if (netSalary < 0) {
      throw new BadRequestException(
        'خطا: کسورات این کارمند (احتمالاً به دلیل مرخصی بدون حقوق زیاد) از مجموع درآمدهای او بیشتر شده است!',
      );
    }

    // ۹. ایجاد رکورد نهایی در دیتابیس (مدل جدید Payroll)
    return await this.prisma.payroll.create({
      data: {
        userId: dto.userId,
        year: dto.year,
        month: dto.month,

        baseSalary: contract.baseSalary,
        totalAllowances,
        grossSalary,

        taxDeduction,
        insuranceDeduction,
        unpaidLeaveDeduction,

        netSalary,

        status: PayrollStatus.PENDING,
      },
    });
  }

  // متدهای findAll, findOne, remove مانند قبل هستند
  async findAll(filters: FilterPayrollDto) {
    return await this.prisma.payroll.findMany({
      where: {
        ...(filters.userId && { userId: filters.userId }),
        ...(filters.year && { year: filters.year }),
        ...(filters.month && { month: filters.month }),
        ...(filters.status && { status: filters.status }),
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number) {
    const payroll = await this.prisma.payroll.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    if (!payroll) throw new NotFoundException('فیش حقوقی یافت نشد.');
    return payroll;
  }

  async remove(id: number) {
    const existing = await this.prisma.payroll.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('فیش حقوقی یافت نشد.');
    await this.prisma.payroll.delete({ where: { id } });
  }

  /**
   * تغییر وضعیت فیش حقوقی (مثلاً از PENDING به PAID) توسط بخش مالی
   */
  async changeStatus(id: number, status: PayrollStatus) {
    const payroll = await this.prisma.payroll.findUnique({
      where: { id },
    });

    if (!payroll) {
      throw new NotFoundException('فیش حقوقی مورد نظر یافت نشد.');
    }

    if (payroll.status === status) {
      throw new BadRequestException(
        `این فیش حقوقی در حال حاضر در وضعیت ${status} قرار دارد.`,
      );
    }

    // اگر وضعیت به پرداخت‌شده تغییر کند، تاریخ امروز به عنوان زمان واریز ثبت می‌شود
    // اگر دوباره به PENDING برگردد (مثلاً به خاطر خطای بانکی)، تاریخ پرداخت پاک می‌شود
    const paymentDate = status === PayrollStatus.PAID ? new Date() : null;

    return await this.prisma.payroll.update({
      where: { id },
      data: {
        status,
        paymentDate,
      },
    });
  }
  
}
