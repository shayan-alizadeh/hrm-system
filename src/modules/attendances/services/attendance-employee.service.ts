import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js'; // پسوند .js حذف شد (استاندارد تایپ‌اسکریپت)
import { FilterAttendanceDto } from '../dto/filter-attendance.dto.js';

@Injectable()
export class AttendanceEmployeeService {
  constructor(private readonly prisma: PrismaService) {}

  async checkIn(userId: number, attendanceDate: string, notes?: string) {
    // جلوگیری از مشکل Dangling Check-ins
    // چک می‌کنیم آیا کاربر هیچ تردد بازی در روزهای گذشته یا امروز دارد؟
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
        checkInTime: new Date(), // سرور با تایم‌زون UTC ذخیره می‌کند (استاندارد جهانی)
        notes: notes ?? null,
        attendanceDate,
      },
    });
  }

  async checkOut(userId: number, attendanceDate: string, notes?: string) {
    // پیدا کردن آخرین ورودِ بدون خروج در همان روز
    const attendance = await this.prisma.attendance.findFirst({
      where: {
        userId,
        checkOutTime: null,
        attendanceDate,
      },
      orderBy: {
        checkInTime: 'desc',
      },
    });

    if (!attendance) {
      throw new NotFoundException(
        'هیچ رکورد ورودیِ بدون خروجی برای امروز یافت نشد!',
      );
    }

    let updatedNotes = attendance.notes;

    if (notes) {
      updatedNotes = attendance.notes
        ? `${attendance.notes} - ${notes}`
        : notes;
    }

    return await this.prisma.attendance.update({
      where: {
        id: attendance.id,
      },
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
        // اعمال داینامیک فیلتر تاریخ با نام‌های اصلاح‌شده
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
