import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { FilterAttendanceDto } from '../dto/filter-attendance.dto.js';
import { UpdateAttendanceDto } from '../dto/update-attendance.dto.js';

@Injectable()
export class AttendanceManagerService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * دریافت لیست حضور و غیاب تمام کارمندان با قابلیت فیلتر
   */
  async findAll(filters: FilterAttendanceDto) {
    return await this.prisma.attendance.findMany({
      where: {
        // فیلتر بر اساس یک کارمند خاص (اگر مدیر userId را فرستاده باشد)
        ...(filters.userId && { userId: filters.userId }),

        // فیلتر بازه زمانی
        ...(filters.startDate && {
          attendanceDate: { gte: filters.startDate },
        }),
        ...(filters.endDate && {
          attendanceDate: { lte: filters.endDate },
        }),
      },
      // برای مدیر مهم است که بداند این رکورد متعلق به کدام کارمند است
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            mobile: true,
          },
        },
      },
      orderBy: {
        checkInTime: 'desc',
      },
    });
  }

  /**
   * دریافت جزئیات یک رکورد خاص
   */
  async findOne(id: number) {
    const attendance = await this.prisma.attendance.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!attendance) {
      throw new NotFoundException('رکورد حضور و غیاب با این شناسه یافت نشد.');
    }

    return attendance;
  }

  /**
   * اصلاح دستی رکورد حضور و غیاب توسط مدیر
   */
  async update(id: number, dto: UpdateAttendanceDto) {
    // ابتدا بررسی می‌کنیم رکورد وجود داشته باشد
    const existingRecord = await this.findOne(id);

    // مدیر ممکن است فقط بخواهد یادداشت بگذارد، یا فقط ساعت خروج را اصلاح کند
    // بنابراین هر فیلدی که فرستاده شده را آپدیت می‌کنیم
    let updatedNotes = existingRecord.notes;

    // اگر مدیر یادداشتی فرستاده بود، آن را به یادداشت‌های قبلی اضافه می‌کنیم (یا جایگزین می‌کنیم)
    if (dto.notes) {
      updatedNotes = existingRecord.notes
        ? `${existingRecord.notes} | یادداشت مدیر: ${dto.notes}`
        : `یادداشت مدیر: ${dto.notes}`;
    }

    return await this.prisma.attendance.update({
      where: { id },
      data: {
        // اگر تاریخ به صورت ISO String فرستاده شده بود، آن را به آبجکت Date تبدیل می‌کنیم
        ...(dto.checkIn && { checkInTime: new Date(dto.checkIn) }),
        ...(dto.checkOut && { checkOutTime: new Date(dto.checkOut) }),
        notes: updatedNotes,
      },
    });
  }

  /**
   * حذف یک رکورد (مثلاً اگر کارمند به اشتباه در روز تعطیل دکمه را زده است)
   */
  async remove(id: number) {
    await this.findOne(id); // بررسی وجود رکورد

    await this.prisma.attendance.delete({
      where: { id },
    });
  }
}
