import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { CreateLeaveRequestDto } from '../dto/create-leave-request.dto.js';
import { FilterLeavesDto } from '../dto/filter-leaves.dto.js';
import { LeaveStatus, LeaveType } from '../../../../generated/prisma/client.js';
import moment from 'moment-jalaali';

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

  private extractYearFromDate(dateStr: string): number {
    return parseInt(dateStr.split('/')[0], 10);
  }

  /**
   * محاسبه روزهای خالص مرخصی با کسر جمعه‌ها و تعطیلات رسمی دیتابیس
   * توجه: متد به async تغییر یافت
   */
  private async calculateTotalDays(
    startDate: string,
    endDate: string,
  ): Promise<number> {
    const start = moment(startDate, 'jYYYY/jMM/jDD');
    const end = moment(endDate, 'jYYYY/jMM/jDD');

    if (!start.isValid() || !end.isValid()) {
      throw new BadRequestException('فرمت تاریخ نامعتبر است.');
    }

    if (end.isBefore(start)) {
      throw new BadRequestException(
        'تاریخ پایان نمی‌تواند قبل از تاریخ شروع باشد.',
      );
    }

    // ۱. دریافت تعطیلات رسمیِ بین تاریخ شروع و پایان از دیتابیس
    // چون تاریخ‌ها را با فرمت YYYY/MM/DD و صفرِ پشت اعداد (Padding) ذخیره کردیم،
    // مقایسه رشته‌ای (String Comparison) در دیتابیس کاملاً دقیق کار می‌کند.
    const holidays = await this.prisma.holiday.findMany({
      where: {
        date: {
          gte: startDate, // بزرگتر مساوی تاریخ شروع
          lte: endDate, // کوچکتر مساوی تاریخ پایان
        },
      },
      select: { date: true },
    });

    // تبدیل به یک آرایه ساده از تاریخ‌ها برای جستجوی سریع (مثلاً ['1404/01/01', ...])
    const holidayDates = holidays.map((h) => h.date);

    let workingDays = 0;
    const currentDay = start.clone(); // کپی برای جلوگیری از تغییر متغیر اصلی

    // ۲. حلقه برای بررسی تک‌تک روزهای مرخصی
    while (currentDay.isSameOrBefore(end)) {
      const currentDateString = currentDay.format('jYYYY/jMM/jDD'); // فرمت کردن دقیق با صفر
      const isFriday = currentDay.day() === 5; // عدد 5 در moment.js یعنی جمعه
      const isOfficialHoliday = holidayDates.includes(currentDateString); // آیا در لیست دیتابیس هست؟

      // فقط در صورتی که نه جمعه باشد و نه تعطیل رسمی، یک روز به مرخصی اضافه می‌شود
      if (!isFriday && !isOfficialHoliday) {
        workingDays++;
      }

      currentDay.add(1, 'days'); // رفتن به روز بعدی
    }

    // اگر کل روزهای درخواستی تعطیل بود (مثلاً مرخصی فقط برای روز جمعه ثبت شده)
    if (workingDays === 0) {
      throw new BadRequestException(
        'بازه انتخابی شما تماماً در روزهای تعطیل قرار دارد.',
      );
    }

    return workingDays;
  }

  async getMyBalance(userId: number, year?: number) {
    // ... کدهای این بخش بدون تغییر باقی می‌ماند (مشابه قبل) ...
    const targetYear = year || this.getCurrentJalaliYear();

    let balance = await this.prisma.leaveBalance.findUnique({
      where: { userId_year: { userId, year: targetYear } },
    });

    if (!balance) {
      balance = await this.prisma.leaveBalance.create({
        data: { userId, year: targetYear, totalDays: 26, usedDays: 0 },
      });
    }
    return balance;
  }

  async createRequest(userId: number, dto: CreateLeaveRequestDto) {
    // نکته مهم: اینجا await اضافه شد چون متد بالا async شده است
    const totalDays = await this.calculateTotalDays(dto.startDate, dto.endDate);

    const requestYear = this.extractYearFromDate(dto.startDate);
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
        totalDays,
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
