import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';

/**
 * سرویس مخصوص کارمندان برای مشاهده دپارتمان‌ها
 * این سرویس فقط عملیات Read را فراهم می‌کند
 */
@Injectable()
export class DepartmentsEmployeeService {
  constructor(private readonly prisma: PrismaService) {}

  /** دریافت تمام دپارتمان‌ها */
  async findAll() {
    return await this.prisma.departments.findMany({
      orderBy: { name: 'asc' },
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
}
