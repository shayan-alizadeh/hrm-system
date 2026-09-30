import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Prisma } from '../../../../generated/prisma/client.js';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { CreateHolidayDto } from '../dto/create-holiday.dto.js';
import { UpdateHolidayDto } from '../dto/update-holiday.dto.js';
import { parseLeaveDate } from '../utils/leave-calendar.js';

@Injectable()
export class HolidayService {
  constructor(private readonly prisma: PrismaService) {}

  private validateTitle(value: unknown): string {
    if (typeof value !== 'string' || value.trim().length === 0) {
      throw new BadRequestException('عنوان تعطیلی الزامی است.');
    }

    const title = value.trim();

    if (title.length > 100) {
      throw new BadRequestException(
        'عنوان تعطیلی نمی‌تواند بیشتر از ۱۰۰ کاراکتر باشد.',
      );
    }

    return title;
  }

  private rethrowWriteError(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        throw new ConflictException('برای این تاریخ قبلاً تعطیلی ثبت شده است.');
      }

      if (error.code === 'P2025') {
        throw new NotFoundException('تعطیلی یافت نشد.');
      }
    }

    throw error;
  }

  async create(dto: CreateHolidayDto) {
    parseLeaveDate(dto.date);
    const title = this.validateTitle(dto.title);

    try {
      return await this.prisma.holiday.create({
        data: {
          date: dto.date,
          title,
        },
      });
    } catch (error: unknown) {
      this.rethrowWriteError(error);
    }
  }

  async findAll(year?: string) {
    if (
      year !== undefined &&
      (typeof year !== 'string' || !/^1[34]\d{2}$/.test(year))
    ) {
      throw new BadRequestException(
        'سال باید چهاررقمی و بین ۱۳۰۰ و ۱۴۹۹ باشد.',
      );
    }

    return this.prisma.holiday.findMany({
      where: year === undefined ? {} : { date: { startsWith: `${year}/` } },
      orderBy: { date: 'asc' },
    });
  }

  async findOne(id: number) {
    const holiday = await this.prisma.holiday.findUnique({
      where: { id },
    });

    if (!holiday) {
      throw new NotFoundException('تعطیلی یافت نشد.');
    }

    return holiday;
  }

  async update(id: number, dto: UpdateHolidayDto) {
    const data: Prisma.HolidayUpdateInput = {};

    // undefined یعنی عدم تغییر؛ null برای این فیلدها مجاز نیست.
    if (dto.date !== undefined) {
      parseLeaveDate(dto.date);
      data.date = dto.date;
    }

    if (dto.title !== undefined) {
      data.title = this.validateTitle(dto.title);
    }

    try {
      return await this.prisma.holiday.update({
        where: { id },
        data,
      });
    } catch (error: unknown) {
      this.rethrowWriteError(error);
    }
  }

  async remove(id: number) {
    try {
      await this.prisma.holiday.delete({
        where: { id },
      });

      return {
        success: true,
        message: 'تعطیلی با موفقیت از سیستم حذف شد.',
      };
    } catch (error: unknown) {
      this.rethrowWriteError(error);
    }
  }
}
