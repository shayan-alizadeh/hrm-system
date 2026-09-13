import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service.js';
// import { FilterAttendanceDto } from '../dto/filter-attendance.dto';

@Injectable()
export class AttendanceEmployeeService {
  constructor(private readonly prisma: PrismaService) {}

  async checkIn(userId: number, j_date: string, notes?: string) {
    if (!j_date) {
      throw new BadRequestException('تاریخ را وارد کنید');
    }

    const openedAttendance = await this.prisma.attendances.findFirst({
      where: {
        userId,
        checkOutTime: null,
        j_date,
      },
    });

    if (openedAttendance) {
      throw new BadRequestException(
        'یک تردد باز داری که هنوز خروجش رو ثبت نکردی',
      );
    }

    return await this.prisma.attendances.create({
      data: {
        userId,
        checkInTime: new Date(),
        notes: notes ?? null,
        j_date,
      },
    });
  }

  async checkOut(userId: number, j_date: string, notes?: string) {
    const attendance = await this.prisma.attendances.findFirst({
      where: {
        userId,
        checkOutTime: null,
        j_date,
      },
      orderBy: {
        checkInTime: 'desc',
      },
    });

    if (!attendance) {
      throw new NotFoundException('هیچ رکورد ورودی بدون خروج یافت نشد!');
    }

    let updatedNotes = attendance.notes;

    if (notes) {
      updatedNotes = attendance.notes
        ? `${attendance.notes} - ${notes}`
        : notes;
    }

    return await this.prisma.attendances.update({
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
    return await this.prisma.attendances.findMany({
      where: {
        userId,

        ...(filters.startTime && {
          j_date: {
            gte: filters.startTime,
          },
        }),

        ...(filters.endTime && {
          j_date: {
            lte: filters.endTime,
          },
        }),
      },

      orderBy: {
        checkInTime: 'desc',
      },
    });
  }
}
