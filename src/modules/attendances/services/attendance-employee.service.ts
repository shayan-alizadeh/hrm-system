import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../../prisma/prisma.service.js';
import {
  appendAttendanceNotes,
  assertAttendanceDate,
  assertAttendanceTimes,
  buildAttendanceDateFilter,
  getTehranJalaliDate,
  runAttendanceTransaction,
  validateAttendanceNotes,
} from '../utils/attendance.utils.js';
import { FilterAttendanceDto } from '../dto/filter-attendance.dto.js';

@Injectable()
export class AttendanceEmployeeService {
  constructor(private readonly prisma: PrismaService) {}

  async checkIn(userId: number, attendanceDate?: string, notes?: string) {
    const validatedNotes = validateAttendanceNotes(notes);

    return runAttendanceTransaction(this.prisma, async (tx) => {
      // نبود تردد باز و ایجاد تردد جدید باید در یک تراکنش بررسی شوند.
      const openedAttendance = await tx.attendance.findFirst({
        where: {
          userId,
          checkOutTime: null,
        },
        select: {
          id: true,
          attendanceDate: true,
        },
      });

      if (openedAttendance) {
        throw new BadRequestException(
          `شما یک تردد باز در تاریخ ${openedAttendance.attendanceDate} دارید که خروج آن ثبت نشده است.`,
        );
      }

      const now = new Date();
      const finalDate = attendanceDate ?? getTehranJalaliDate(now);

      assertAttendanceDate(finalDate);

      return tx.attendance.create({
        data: {
          userId,
          attendanceDate: finalDate,
          checkInTime: now,
          notes: validatedNotes,
        },
      });
    });
  }

  async checkOut(userId: number, attendanceDate?: string, notes?: string) {
    return runAttendanceTransaction(this.prisma, async (tx) => {
      // رفتار قبلی حفظ شده است: بدون تاریخ، تردد روز جاری جست‌وجو می‌شود.
      const finalDate = attendanceDate ?? getTehranJalaliDate(new Date());

      assertAttendanceDate(finalDate);

      const attendance = await tx.attendance.findFirst({
        where: {
          userId,
          attendanceDate: finalDate,
          checkOutTime: null,
        },
        orderBy: [{ checkInTime: 'desc' }, { id: 'desc' }],
      });

      if (!attendance) {
        throw new NotFoundException(
          'هیچ رکورد ورودیِ بدون خروج برای این تاریخ یافت نشد.',
        );
      }

      if (attendance.checkInTime === null) {
        throw new BadRequestException(
          'این رکورد ساعت ورود ندارد؛ اصلاح آن باید توسط مدیر انجام شود.',
        );
      }

      const checkOutTime = new Date();

      assertAttendanceTimes(attendance.checkInTime, checkOutTime);

      const updatedNotes = appendAttendanceNotes(attendance.notes, notes);

      return tx.attendance.update({
        where: {
          id: attendance.id,
        },
        data: {
          checkOutTime,
          notes: updatedNotes,
        },
      });
    });
  }

  async findMyAttendance(userId: number, filters: FilterAttendanceDto) {
    const dateFilter = buildAttendanceDateFilter(
      filters.startDate,
      filters.endDate,
    );

    return this.prisma.attendance.findMany({
      where: {
        // شناسه مالک از توکن می‌آید؛ userId احتمالی query استفاده نمی‌شود.
        userId,
        attendanceDate: dateFilter,
      },
      orderBy: [{ checkInTime: 'desc' }, { id: 'desc' }],
    });
  }
}
