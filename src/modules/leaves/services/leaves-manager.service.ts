import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js'; 
import { FilterLeavesDto } from '../dto/filter-leaves.dto.js';
import { ResolveLeaveRequestDto } from '../dto/resolve-leave-request.dto.js';
import { LeaveStatus, LeaveType } from '../../../../generated/prisma/client.js';

@Injectable()
export class LeavesManagerService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllRequests(filters: FilterLeavesDto) {
    return await this.prisma.leaveRequest.findMany({
      where: {
        ...(filters.userId && { userId: filters.userId }),
        ...(filters.status && { status: filters.status }),
        ...(filters.leaveType && { leaveType: filters.leaveType }),
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getRequestById(id: number) {
    const request = await this.prisma.leaveRequest.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    if (!request) throw new NotFoundException('درخواست مرخصی یافت نشد.');
    return request;
  }

  async resolveRequest(id: number, dto: ResolveLeaveRequestDto) {
    const request = await this.prisma.leaveRequest.findUnique({
      where: { id },
    });

    if (!request) throw new NotFoundException('درخواست مرخصی یافت نشد.');

    if (request.status !== LeaveStatus.PENDING) {
      throw new BadRequestException(
        'این درخواست قبلاً بررسی شده یا توسط کارمند لغو شده است.',
      );
    }

    // استفاده از تراکنش (Transaction) برای اطمینان از یکپارچگی داده‌ها
    return await this.prisma.$transaction(async (tx) => {
      // اگر مدیر مرخصی استحقاقی را تایید کرد، باید از موجودی کارمند کسر کنیم
      if (
        dto.status === LeaveStatus.APPROVED &&
        request.leaveType === LeaveType.ANNUAL
      ) {
        // ۱. استخراج سال از تاریخ درخواست (مثلا 1404)
        const requestYear = parseInt(request.startDate.split('/')[0], 10);

        // ۲. استفاده از کلید ترکیبی userId_year به جای userId به تنهایی
        const balance = await tx.leaveBalance.findUnique({
          where: {
            userId_year: {
              userId: request.userId,
              year: requestYear,
            },
          },
        });

        if (
          !balance ||
          balance.totalDays - balance.usedDays < request.totalDays
        ) {
          throw new BadRequestException(
            `کارمند مورد نظر در سال ${requestYear} موجودی مرخصی کافی ندارد.`,
          );
        }

        // ۳. کسر از موجودی با استفاده از کلید ترکیبی
        await tx.leaveBalance.update({
          where: {
            userId_year: {
              userId: request.userId,
              year: requestYear,
            },
          },
          data: {
            usedDays: balance.usedDays + request.totalDays,
          },
        });
      }

      // ۴. آپدیت وضعیت خود درخواست مرخصی
      return await tx.leaveRequest.update({
        where: { id },
        data: {
          status: dto.status,
          managerNote: dto.managerNote,
          resolvedAt: new Date(), // ثبت زمان دقیق بررسی مدیر
        },
      });
    });
  }

  async getAllBalances() {
    return await this.prisma.leaveBalance.findMany({
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }
}
