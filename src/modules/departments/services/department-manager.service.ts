import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';

import { Prisma } from '../../../../generated/prisma/client.js';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { CreateDepartmentDto } from '../dto/create-department.dto.js';
import { UpdateDepartmentDto } from '../dto/update-department.dto.js';

const MAX_DELETE_ATTEMPTS = 3;

@Injectable()
export class DepartmentManagerService {
  constructor(private readonly prisma: PrismaService) {}

  async create(payload: CreateDepartmentDto) {
    return this.prisma.department.create({
      data: payload,
    });
  }

  async findAll() {
    return this.prisma.department.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        _count: {
          select: {
            users: true,
          },
        },
      },
    });
  }

  async findOne(id: number) {
    const department = await this.prisma.department.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
          },
        },
      },
    });

    if (!department) {
      throw new NotFoundException('دپارتمانی با این شناسه یافت نشد.');
    }

    return department;
  }

  async update(id: number, payload: UpdateDepartmentDto) {
    try {
      // خود update نبود رکورد را تشخیص می‌دهد؛ بررسی جداگانه
      // جلوی حذف هم‌زمان را نمی‌گیرد و یک کوئری اضافه ایجاد می‌کند.
      return await this.prisma.department.update({
        where: { id },
        data: payload,
      });
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('دپارتمانی با این شناسه یافت نشد.');
      }

      throw error;
    }
  }

  /**
   * فقط دپارتمان بدون عضو حذف می‌شود.
   *
   * وجود دپارتمان، شمارش اعضا و حذف در یک تراکنش Serializable
   * انجام می‌شوند تا تغییر هم‌زمان عضویت، بررسی اولیه را بی‌اعتبار نکند.
   */
  async remove(id: number): Promise<void> {
    for (let attempt = 0; attempt < MAX_DELETE_ATTEMPTS; attempt += 1) {
      try {
        await this.prisma.$transaction(
          async (tx) => {
            const department = await tx.department.findUnique({
              where: { id },
              select: { id: true },
            });

            if (!department) {
              throw new NotFoundException('دپارتمانی با این شناسه یافت نشد.');
            }

            // مطابق رفتار قبلی، همه کاربران عضو شمارش می‌شوند؛
            // نقش و فعال‌بودن کاربر تأثیری بر ممنوعیت حذف ندارد.
            const usersCount = await tx.user.count({
              where: {
                departmentId: id,
              },
            });

            if (usersCount > 0) {
              throw new BadRequestException(
                `این دپارتمان ${usersCount} عضو دارد و قابل حذف نیست. ابتدا اعضا را منتقل کنید.`,
              );
            }

            await tx.department.delete({
              where: { id },
            });
          },
          {
            isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          },
        );

        return;
      } catch (error: unknown) {
        if (!(error instanceof Prisma.PrismaClientKnownRequestError)) {
          throw error;
        }

        if (error.code === 'P2025') {
          throw new NotFoundException('دپارتمانی با این شناسه یافت نشد.');
        }

        // فقط تعارض تراکنش یا deadlock قابل تکرار است.
        // خطاهای اعتبارسنجی و سایر خطاهای دیتابیس تکرار نمی‌شوند.
        if (error.code !== 'P2034') {
          throw error;
        }

        if (attempt === MAX_DELETE_ATTEMPTS - 1) {
          throw new ServiceUnavailableException(
            'حذف دپارتمان به‌دلیل عملیات هم‌زمان انجام نشد؛ دوباره تلاش کنید.',
          );
        }
      }
    }
  }
}
