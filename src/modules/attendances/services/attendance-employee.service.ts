import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { FilterAttendanceDto } from '../dto/filter-attendance.dto.js';

@Injectable()
export class AttendanceEmployeeService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * متد کمکی برای دریافت تاریخ امروزِ سرور به شمسی (فرمت yyyy/mm/dd)
   */
  private getServerJalaliDate(): string {
    const formatter = new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      calendar: 'persian',
      numberingSystem: 'latn', // استفاده از اعداد انگلیسی برای هم‌خوانی با Regex شما
      timeZone: 'Asia/Tehran', // تنظیم منطقه زمانی روی ایران
    });

    // خروجی به شکل "1404/09/26" خواهد بود
    return formatter.format(new Date());
  }

  // اضافه شدن علامت ? به attendanceDate برای پذیرش undefined
  async checkIn(userId: number, attendanceDate?: string, notes?: string) {
    // جادوی اصلی: اگر کلاینت تاریخ را نفرستاد، سرور خودش تاریخ امروز را محاسبه می‌کند
    const finalDate = attendanceDate || this.getServerJalaliDate();

    // جلوگیری از Dangling Check-ins (تردد باز)
    const openedAttendance = await this.prisma.attendance.findFirst({
      where: {
        userId,
        checkOutTime: null,
      },
    });

    if (openedAttendance) {
      throw new BadRequestException(
        `شما یک تردد باز در تاریخ ${openedAttendance.attendanceDate} دارید که خروج آن ثبت نشده است. لطفاً برای اصلاح به مدیر مراجعه کنید.`,
      );
    }

    return await this.prisma.attendance.create({
      data: {
        userId,
        checkInTime: new Date(),
        notes: notes ?? null,
        attendanceDate: finalDate, // استفاده از تاریخ محاسبه شده نهایی
      },
    });
  }

  // اضافه شدن علامت ? به attendanceDate
  async checkOut(userId: number, attendanceDate?: string, notes?: string) {
    const finalDate = attendanceDate || this.getServerJalaliDate();

    const attendance = await this.prisma.attendance.findFirst({
      where: {
        userId,
        checkOutTime: null,
        attendanceDate: finalDate, // استفاده از تاریخ نهایی برای پیدا کردن رکورد امروز
      },
      orderBy: {
        checkInTime: 'desc',
      },
    });

    if (!attendance) {
      throw new NotFoundException(
        'هیچ رکورد ورودیِ بدون خروجی برای این تاریخ یافت نشد!',
      );
    }

    let updatedNotes = attendance.notes;
    if (notes) {
      updatedNotes = attendance.notes
        ? `${attendance.notes} - ${notes}`
        : notes;
    }

    return await this.prisma.attendance.update({
      where: { id: attendance.id },
      data: {
        checkOutTime: new Date(),
        notes: updatedNotes,
      },
    });
  }

  async findMyAttendance(userId: number, filters: FilterAttendanceDto) {
    return await this.prisma.attendance.findMany({
      where: {
        userId,
        ...(filters.startDate && {
          attendanceDate: {
            gte: filters.startDate,
          },
        }),
        ...(filters.endDate && {
          attendanceDate: {
            lte: filters.endDate,
          },
        }),
      },
      orderBy: {
        checkInTime: 'desc',
      },
    });
  }
}
