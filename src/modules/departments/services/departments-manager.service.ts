import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateDepartmentDto } from '../dto/create-department.dto.js';
import { UpdateDepartmentDto } from '../dto/update-department.dto.js';
import { PrismaService } from '../../../prisma/prisma.service.js';

/**
 * سرویس مدیریت دپارتمان‌ها برای پنل ادمین
 * شامل عملیات CRUD کامل است
 */
@Injectable()
export class DepartmentsManagerService {
  constructor(private readonly prisma: PrismaService) {}

  /** ایجاد دپارتمان جدید */
  async create(payload: CreateDepartmentDto){
    return await this.prisma.departments.create({
      data: payload,
    });
  }

  /** دریافت همه دپارتمان‌ها */
  async findAll() {
    return await this.prisma.departments.findMany({
      orderBy: {
        createdAt: 'desc', // در پریزما از حروف کوچک برای desc/asc استفاده می‌شود
      },
    });
  }

  /** دریافت یک دپارتمان با شناسه */
  async findOne(id: number) {
    const department = await this.prisma.departments.findUnique({
      where: { id },
    });

    if (!department) {
      throw new NotFoundException(`Department with id ${id} not found`);
    }

    return department;
  }

  /** به‌روزرسانی اطلاعات دپارتمان */
  async update(id: number, payload: UpdateDepartmentDto) {
    // ابتدا بررسی می‌کنیم که دپارتمان وجود داشته باشد تا در صورت عدم وجود ارور 404 بدهد
    await this.findOne(id);

    return await this.prisma.departments.update({
      where: { id },
      data: payload,
    });
  }

  /** حذف دپارتمان */
  async remove(id: number) {
    // بررسی وجود دپارتمان قبل از حذف
    await this.findOne(id);

    await this.prisma.departments.delete({
      where: { id },
    });
  }
}
