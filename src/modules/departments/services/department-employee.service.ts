import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';

@Injectable()
export class DepartmentEmployeeService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    // اصلاح نام مدل به department
    return await this.prisma.department.findMany({
      orderBy: { name: 'asc' },
      // کارمندان فقط به نام و توضیحات نیاز دارند (بهینه‌سازی کوئری)
      select: {
        id: true,
        name: true,
        description: true,
      },
    });
  }

  async findOne(id: number) {
    const department = await this.prisma.department.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
      },
    });

    if (!department) {
      throw new NotFoundException('دپارتمانی با این شناسه یافت نشد.');
    }

    return department;
  }
}
