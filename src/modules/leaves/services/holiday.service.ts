import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js'; // در صورت نیاز پسوند .js را بردارید
import { CreateHolidayDto } from '../dto/create-holiday.dto.js';
import { UpdateHolidayDto } from '../dto/update-holiday.dto.js';

@Injectable()
export class HolidayService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateHolidayDto) {
    // بررسی تکراری نبودن تاریخ
    const existing = await this.prisma.holiday.findUnique({
      where: { date: dto.date },
    });

    if (existing) {
      throw new ConflictException(
        `برای تاریخ ${dto.date} قبلاً مناسبت "${existing.title}" ثبت شده است.`,
      );
    }

    return await this.prisma.holiday.create({
      data: {
        date: dto.date,
        title: dto.title,
      },
    });
  }

  /**
   * دریافت لیست تعطیلات
   * @param year (اختیاری) در صورت ارسال، فقط تعطیلات همان سال را برمی‌گرداند
   */
  async findAll(year?: string) {
    return await this.prisma.holiday.findMany({
      where: {
        ...(year && { date: { startsWith: year } }), // فیلتر هوشمند با شروع رشته (مثلا "1404")
      },
      orderBy: { date: 'asc' }, // مرتب‌سازی تقویمی از فروردین به اسفند
    });
  }

  async findOne(id: number) {
    const holiday = await this.prisma.holiday.findUnique({
      where: { id },
    });

    if (!holiday) throw new NotFoundException('تعطیلی یافت نشد.');
    return holiday;
  }

  async update(id: number, dto: UpdateHolidayDto) {
    const existing = await this.prisma.holiday.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('تعطیلی یافت نشد.');

    // اگر قرار است تاریخ تغییر کند، چک می‌کنیم تاریخ جدید تکراری نباشد
    if (dto.date && dto.date !== existing.date) {
      const duplicateDate = await this.prisma.holiday.findUnique({
        where: { date: dto.date },
      });

      if (duplicateDate) {
        throw new ConflictException('تاریخ جدید با یک تعطیلی دیگر تداخل دارد.');
      }
    }

    return await this.prisma.holiday.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: number) {
    const existing = await this.prisma.holiday.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('تعطیلی یافت نشد.');

    await this.prisma.holiday.delete({ where: { id } });
    return { success: true, message: 'تعطیلی با موفقیت از سیستم حذف شد.' };
  }
}
