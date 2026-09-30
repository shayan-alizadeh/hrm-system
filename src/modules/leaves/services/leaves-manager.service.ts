import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type { Prisma } from '../../../../generated/prisma/client.js';
import { LeaveStatus, LeaveType } from '../../../../generated/prisma/enums.js';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { FilterLeaveDto } from '../dto/filter-leave.dto.js';
import { ResolveLeaveRequestDto } from '../dto/resolve-leave-request.dto.js';
import {
  calculateLeaveDays,
  ensureLeaveBalance,
} from '../utils/leave-calendar.js';
import { buildLeaveRequestFilter } from '../utils/leave-request-filter.js';
import { runLeaveTransaction } from '../utils/leave-transaction.js';

@Injectable()
export class LeavesManagerService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllRequests(filters: FilterLeaveDto) {
    return this.prisma.leaveRequest.findMany({
      where: {
        ...buildLeaveRequestFilter(filters),
        ...(filters.userId !== undefined && {
          userId: filters.userId,
        }),
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });
  }

  async getRequestById(id: number) {
    const request = await this.prisma.leaveRequest.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!request) {
      throw new NotFoundException('درخواست مرخصی یافت نشد.');
    }

    return request;
  }

  async resolveRequest(id: number, dto: ResolveLeaveRequestDto) {
    if (
      dto.status !== LeaveStatus.APPROVED &&
      dto.status !== LeaveStatus.REJECTED
    ) {
      throw new BadRequestException(
        'نتیجه بررسی فقط می‌تواند APPROVED یا REJECTED باشد.',
      );
    }

    return runLeaveTransaction(this.prisma, async (tx) => {
      const request = await tx.leaveRequest.findUnique({
        where: { id },
      });

      if (!request) {
        throw new NotFoundException('درخواست مرخصی یافت نشد.');
      }

      if (request.status !== LeaveStatus.PENDING) {
        throw new BadRequestException('درخواست قبلاً بررسی یا لغو شده است.');
      }

      if (dto.status === LeaveStatus.APPROVED) {
        const calculation = await calculateLeaveDays(
          tx,
          request.startDate,
          request.endDate,
        );

        // تعداد روزهای درخواست بدون اطلاع کارمند تغییر داده نمی‌شود.
        if (calculation.totalDays !== request.totalDays) {
          throw new ConflictException(
            'تعداد روزهای درخواست با تقویم فعلی سازگار نیست؛ درخواست باید با محاسبه جدید ثبت شود.',
          );
        }

        const overlapping = await tx.leaveRequest.findFirst({
          where: {
            id: { not: id },
            userId: request.userId,
            status: LeaveStatus.APPROVED,
            startDate: { lte: request.endDate },
            endDate: { gte: request.startDate },
          },
          select: { id: true },
        });

        if (overlapping) {
          throw new ConflictException(
            'بازه درخواست با یک مرخصی تأییدشده هم‌پوشانی دارد.',
          );
        }

        const tracksBalance =
          request.leaveType === LeaveType.ANNUAL ||
          request.leaveType === LeaveType.SICK ||
          request.leaveType === LeaveType.UNPAID;

        if (tracksBalance) {
          for (const [year, days] of calculation.daysByYear) {
            const balance = await ensureLeaveBalance(tx, request.userId, year);

            const data: Prisma.LeaveBalanceUpdateInput = {};

            switch (request.leaveType) {
              case LeaveType.ANNUAL: {
                const remaining = balance.totalDays - balance.usedDays;

                if (!Number.isFinite(remaining) || remaining < days) {
                  throw new BadRequestException(
                    `موجودی مرخصی استحقاقی سال ${year} کافی نیست.`,
                  );
                }

                data.usedDays = { increment: days };
                break;
              }

              case LeaveType.SICK:
                data.usedSickDays = { increment: days };
                break;

              case LeaveType.UNPAID:
                data.usedUnpaidDays = { increment: days };
                break;
            }

            await tx.leaveBalance.update({
              where: {
                userId_year: {
                  userId: request.userId,
                  year,
                },
              },
              data,
            });
          }
        }
      }

      // شکست تغییر وضعیت، تغییرات موجودی را نیز rollback می‌کند.
      const result = await tx.leaveRequest.updateMany({
        where: {
          id,
          status: LeaveStatus.PENDING,
        },
        data: {
          status: dto.status,
          ...(dto.managerNote !== undefined && {
            managerNote: dto.managerNote,
          }),
          resolvedAt: new Date(),
        },
      });

      if (result.count !== 1) {
        throw new ConflictException('وضعیت درخواست هم‌زمان تغییر کرده است.');
      }

      return tx.leaveRequest.findUniqueOrThrow({
        where: { id },
      });
    });
  }

  async getAllBalances() {
    return this.prisma.leaveBalance.findMany({
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: [{ year: 'desc' }, { userId: 'asc' }],
    });
  }
}
