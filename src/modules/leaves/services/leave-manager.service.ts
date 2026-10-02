import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type {
  Prisma,
  LeaveRequest,
  LeaveBalance,
} from '../../../../generated/prisma/client.js';
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
export class LeaveManagerService {
  constructor(private readonly prisma: PrismaService) {}

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

  async getAllRequests(filters: FilterLeaveDto) {
    const requests = await this.prisma.leaveRequest.findMany({
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

    return requests.map((req) => this.mapLeaveRequest(req));
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

    return this.mapLeaveRequest(request);
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

    const resolvedRequest = await runLeaveTransaction(
      this.prisma,
      async (tx) => {
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

          // مقایسه امن دسیما
          if (calculation.totalDays !== Number(request.totalDays)) {
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
              const balance = await ensureLeaveBalance(
                tx,
                request.userId,
                year,
              );

              const data: Prisma.LeaveBalanceUpdateInput = {};

              switch (request.leaveType) {
                case LeaveType.ANNUAL: {
                  // تبدیل به عدد برای جلوگیری از خطای دسیما
                  const remaining =
                    Number(balance.totalDays) - Number(balance.usedDays);

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
      },
    );

    return this.mapLeaveRequest(resolvedRequest);
  }

  async getAllBalances() {
    const balances = await this.prisma.leaveBalance.findMany({
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

    return balances.map((b) => this.mapLeaveBalance(b));
  }
}
