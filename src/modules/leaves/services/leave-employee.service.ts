import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type {
  LeaveRequest,
  LeaveBalance,
} from '../../../../generated/prisma/client.js';
import { LeaveStatus, LeaveType } from '../../../../generated/prisma/enums.js';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { CreateLeaveRequestDto } from '../dto/create-leave-request.dto.js';
import { FilterLeaveDto } from '../dto/filter-leave.dto.js';
import {
  assertLeaveYear,
  calculateLeaveDays,
  ensureLeaveBalance,
  getCurrentTehranJalaliYear,
} from '../utils/leave-calendar.js';
import { buildLeaveRequestFilter } from '../utils/leave-request-filter.js';
import { runLeaveTransaction } from '../utils/leave-transaction.js';

@Injectable()
export class LeaveEmployeeService {
  constructor(private readonly prisma: PrismaService) {}

  /** تبدیل امن دسیما به عدد صحیح برای بازگردانی به فرانت‌اند */
  private mapLeaveBalance(balance: LeaveBalance) {
    return {
      ...balance,
      totalDays: Number(balance.totalDays),
      usedDays: Number(balance.usedDays),
      usedSickDays: Number(balance.usedSickDays),
      usedUnpaidDays: Number(balance.usedUnpaidDays),
    };
  }

  private mapLeaveRequest(request: LeaveRequest) {
    return {
      ...request,
      totalDays: Number(request.totalDays),
    };
  }

  async getMyBalance(userId: number, year?: number) {
    const targetYear = year ?? getCurrentTehranJalaliYear();
    assertLeaveYear(targetYear);

    const balance = await runLeaveTransaction(this.prisma, async (tx) => {
      return ensureLeaveBalance(tx, userId, targetYear);
    });

    return this.mapLeaveBalance(balance);
  }

  async createRequest(userId: number, dto: CreateLeaveRequestDto) {
    if (!Object.values(LeaveType).includes(dto.leaveType)) {
      throw new BadRequestException('نوع مرخصی نامعتبر است.');
    }

    if (typeof dto.reason !== 'string' || dto.reason.trim().length === 0) {
      throw new BadRequestException('علت درخواست مرخصی الزامی است.');
    }

    const createdRequest = await runLeaveTransaction(
      this.prisma,
      async (tx) => {
        const calculation = await calculateLeaveDays(
          tx,
          dto.startDate,
          dto.endDate,
        );

        const overlapping = await tx.leaveRequest.findFirst({
          where: {
            userId,
            status: {
              in: [LeaveStatus.PENDING, LeaveStatus.APPROVED],
            },
            startDate: { lte: dto.endDate },
            endDate: { gte: dto.startDate },
          },
          select: { id: true },
        });

        if (overlapping) {
          throw new ConflictException(
            'این بازه با یک درخواست در انتظار یا تأییدشده هم‌پوشانی دارد.',
          );
        }

        if (dto.leaveType === LeaveType.ANNUAL) {
          for (const [year, days] of calculation.daysByYear) {
            const balance = await ensureLeaveBalance(tx, userId, year);
            // تبدیل به number جهت انجام صحیح محاسبات روی دسیما
            const remaining =
              Number(balance.totalDays) - Number(balance.usedDays);

            if (!Number.isFinite(remaining) || remaining < days) {
              throw new BadRequestException(
                `موجودی مرخصی استحقاقی سال ${year} کافی نیست.`,
              );
            }
          }
        }

        return tx.leaveRequest.create({
          data: {
            userId,
            leaveType: dto.leaveType,
            startDate: dto.startDate,
            endDate: dto.endDate,
            totalDays: calculation.totalDays,
            reason: dto.reason.trim(),
            status: LeaveStatus.PENDING,
          },
        });
      },
    );

    return this.mapLeaveRequest(createdRequest);
  }

  async getMyRequests(userId: number, filters: FilterLeaveDto) {
    const requests = await this.prisma.leaveRequest.findMany({
      where: {
        ...buildLeaveRequestFilter(filters),
        userId,
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });

    return requests.map((req) => this.mapLeaveRequest(req));
  }

  async cancelRequest(id: number, userId: number) {
    const canceledRequest = await runLeaveTransaction(
      this.prisma,
      async (tx) => {
        const request = await tx.leaveRequest.findFirst({
          where: { id, userId },
        });

        if (!request) {
          throw new NotFoundException('درخواست مرخصی یافت نشد.');
        }

        if (request.status !== LeaveStatus.PENDING) {
          throw new BadRequestException(
            'فقط درخواست در حال بررسی قابل لغو است.',
          );
        }

        const result = await tx.leaveRequest.updateMany({
          where: {
            id,
            userId,
            status: LeaveStatus.PENDING,
          },
          data: {
            status: LeaveStatus.CANCELED,
          },
        });

        if (result.count !== 1) {
          throw new ConflictException('وضعیت درخواست هم‌زمان تغییر کرده است.');
        }

        return tx.leaveRequest.findUniqueOrThrow({
          where: { id },
        });
      },
    );

    return this.mapLeaveRequest(canceledRequest);
  }
}
