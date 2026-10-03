import { Injectable, NotFoundException } from '@nestjs/common';

import { Prisma } from '../../../../generated/prisma/client.js';
import { PrismaService } from '../../../prisma/prisma.service.js';
import {
  appendAttendanceNotes,
  assertAttendanceTimes,
  buildAttendanceDateFilter,
  parseAttendanceTime,
  runAttendanceTransaction,
} from '../utils/attendance.utils.js';
import { FilterAttendanceDto } from '../dto/filter-attendance.dto.js';
import { UpdateAttendanceDto } from '../dto/update-attendance.dto.js';

@Injectable()
export class AttendanceManagerService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filters: FilterAttendanceDto) {
    const dateFilter = buildAttendanceDateFilter(
      filters.startDate,
      filters.endDate,
    );

    // اعتبارسنجی تکراری userId که وظیفه DTO بود از این قسمت حذف شد.

    return this.prisma.attendance.findMany({
      where: {
        ...(filters.userId !== undefined && { userId: filters.userId }),
        attendanceDate: dateFilter,
      },
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
      orderBy: [{ checkInTime: 'desc' }, { id: 'desc' }],
    });
  }

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

  async update(id: number, dto: UpdateAttendanceDto) {
    return runAttendanceTransaction(this.prisma, async (tx) => {
      const existingRecord = await tx.attendance.findUnique({
        where: { id },
      });

      if (!existingRecord) {
        throw new NotFoundException('رکورد حضور و غیاب با این شناسه یافت نشد.');
      }

      // برای بررسی ترتیب، مقدار جدید با مقدار فعلی فیلد دیگر ترکیب می‌شود.
      // null یا رشته خالی، دستور پاک‌کردن ساعت محسوب نمی‌شود و رد خواهد شد.
      const checkInTime =
        dto.checkIn !== undefined
          ? parseAttendanceTime(dto.checkIn, 'ساعت ورود')
          : existingRecord.checkInTime;

      const checkOutTime =
        dto.checkOut !== undefined
          ? parseAttendanceTime(dto.checkOut, 'ساعت خروج')
          : existingRecord.checkOutTime;

      assertAttendanceTimes(checkInTime, checkOutTime);

      const updatedNotes = appendAttendanceNotes(
        existingRecord.notes,
        dto.notes,
        true,
      );

      return tx.attendance.update({
        where: { id },
        data: {
          ...(dto.checkIn !== undefined && { checkInTime }),
          ...(dto.checkOut !== undefined && { checkOutTime }),
          notes: updatedNotes,
        },
      });
    });
  }

  async remove(id: number): Promise<void> {
    try {
      // حذف مستقیم، فاصله بین بررسی وجود و اجرای delete را حذف می‌کند.
      await this.prisma.attendance.delete({
        where: { id },
      });
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('رکورد حضور و غیاب با این شناسه یافت نشد.');
      }

      throw error;
    }
  }
}
