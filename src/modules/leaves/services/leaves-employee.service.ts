import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { CreateLeaveRequestDto } from '../dto/create-leave-request.dto.js';
import { FilterLeavesDto } from '../dto/filter-leaves.dto.js';
import { LeaveStatus, LeaveType } from '../../../../generated/prisma/client.js';

@Injectable()
export class LeavesEmployeeService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * متد کمکی برای دریافت سال شمسی جاری
   */
  private getCurrentJalaliYear(): number {
    const formatter = new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      numberingSystem: 'latn',
    });
    return Number(formatter.format(new Date()));
  }

  /**
   * استخراج سال از تاریخ شمسی (مثلاً "1404/09/01" <- 1404)
   */
  private extractYearFromDate(dateStr: string): number {
    return parseInt(dateStr.split('/')[0], 10);
  }

  /**
   * الگوریتم محاسبه تعداد روزهای مرخصی (نسخه ساده‌شده)
   * توجه: در نسخه Production برای محاسبه مرخصی‌هایی که بین دو ماه مختلف هستند (مثلاً از ۲۹ آبان تا ۲ آذر)
   * حتماً از پکیج‌هایی مثل jalali-moment یا date-fns-jalali استفاده کنید.
   */
  private calculateTotalDays(startDate: string, endDate: string): number {
    const startDay = parseInt(startDate.split('/')[2], 10);
    const endDay = parseInt(endDate.split('/')[2], 10);

    const diff = endDay - startDay + 1;
    if (diff < 1) {
      throw new BadRequestException(
        'تاریخ پایان نمی‌تواند قبل از تاریخ شروع باشد (یا مرخصی بین دو ماه متفاوت است).',
      );
    }

    // کسر یک روز به ازای هر ۷ روز (محاسبه حدودی جمعه‌ها)
    const fridays = Math.floor(diff / 7);
    return diff - fridays;
  }

  // اضافه شدن پارامتر year به صورت Optional
  async getMyBalance(userId: number, year?: number) {
    const targetYear = year || this.getCurrentJalaliYear();

    let balance = await this.prisma.leaveBalance.findUnique({
      where: {
        // استفاده از سینتکس کلید ترکیبی در Prisma
        userId_year: {
          userId,
          year: targetYear,
        },
      },
    });

    if (!balance) {
      balance = await this.prisma.leaveBalance.create({
        data: {
          userId,
          year: targetYear,
          totalDays: 26,
          usedDays: 0,
        },
      });
    }

    return balance;
  }

  // اصلاح متد ثبت درخواست
  async createRequest(userId: number, dto: CreateLeaveRequestDto) {
    const totalDays = this.calculateTotalDays(dto.startDate, dto.endDate);

    // استخراج سال از تاریخ شروع درخواست مرخصی
    const requestYear = this.extractYearFromDate(dto.startDate);

    // دریافت موجودی کارمند دقیقاً برای همان سالِ درخواست
    const balance = await this.getMyBalance(userId, requestYear);

    if (dto.leaveType === LeaveType.ANNUAL) {
      const remaining = balance.totalDays - balance.usedDays;
      if (totalDays > remaining) {
        throw new BadRequestException(
          `موجودی مرخصی شما در سال ${requestYear} کافی نیست. مانده: ${remaining} روز.`,
        );
      }
    }

    return await this.prisma.leaveRequest.create({
      data: {
        userId,
        leaveType: dto.leaveType,
        startDate: dto.startDate,
        endDate: dto.endDate,
        totalDays, // ثبت روزهای محاسبه شده در سرور
        reason: dto.reason,
        status: LeaveStatus.PENDING,
      },
    });
  }

  async getMyRequests(userId: number, filters: FilterLeavesDto) {
    return await this.prisma.leaveRequest.findMany({
      where: {
        userId,
        ...(filters.status && { status: filters.status }),
        ...(filters.leaveType && { leaveType: filters.leaveType }),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async cancelRequest(id: number, userId: number) {
    const request = await this.prisma.leaveRequest.findFirst({
      where: { id, userId },
    });

    if (!request) throw new NotFoundException('درخواست مرخصی یافت نشد.');

    if (request.status !== LeaveStatus.PENDING) {
      throw new BadRequestException(
        'فقط درخواست‌های در حال بررسی (PENDING) قابل لغو هستند.',
      );
    }

    return await this.prisma.leaveRequest.update({
      where: { id },
      data: { status: LeaveStatus.CANCELED },
    });
  }
}
