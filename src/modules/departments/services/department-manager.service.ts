import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CreateDepartmentDto } from '../dto/create-department.dto.js';
import { UpdateDepartmentDto } from '../dto/update-department.dto.js';
import { PrismaService } from '../../../prisma/prisma.service.js';

@Injectable()
export class DepartmentManagerService {
  constructor(private readonly prisma: PrismaService) {}

  async create(payload: CreateDepartmentDto) {
    return await this.prisma.department.create({
      data: payload,
    });
  }

  async findAll() {
    return await this.prisma.department.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      // اضافه کردن تعداد کارمندان هر دپارتمان برای پنل مدیریت
      include: {
        _count: {
          select: { users: true },
        },
      },
    });
  }

  async findOne(id: number) {
    const department = await this.prisma.department.findUnique({
      where: { id },
      include: {
        _count: {
          select: { users: true },
        },
      },
    });

    if (!department) {
      throw new NotFoundException('دپارتمانی با این شناسه یافت نشد.');
    }

    return department;
  }

  async update(id: number, payload: UpdateDepartmentDto) {
    await this.findOne(id); // چک کردن وجود دپارتمان

    return await this.prisma.department.update({
      where: { id },
      data: payload,
    });
  }

  async remove(id: number) {
    // ۱. بررسی وجود دپارتمان
    await this.findOne(id);

    // ۲. بررسی منطق تجاری: آیا کارمندی در این دپارتمان هست؟
    const usersCount = await this.prisma.user.count({
      where: { departmentId: id },
    });

    if (usersCount > 0) {
      throw new BadRequestException(
        `نمی‌توانید این دپارتمان را حذف کنید زیرا ${usersCount} کارمند در آن عضو هستند. ابتدا کارمندان را منتقل کنید.`,
      );
    }

    // ۳. حذف دپارتمان
    await this.prisma.department.delete({
      where: { id },
    });
  }
}
