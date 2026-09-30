import { BadRequestException } from '@nestjs/common';

import type { Prisma } from '../../../../generated/prisma/client.js';
import type { FilterLeaveDto } from '../dto/filter-leave.dto.js';
import { parseLeaveDate } from './leave-calendar.js';

/**
 * ساخت فیلترهای مشترک بدون تعیین مالکیت.
 * بازه تاریخ شامل هر درخواستی است که با بازه جست‌وجو اشتراک دارد.
 */
export function buildLeaveRequestFilter(
  filters: FilterLeaveDto,
): Prisma.LeaveRequestWhereInput {
  if (filters.startDate !== undefined) {
    parseLeaveDate(filters.startDate);
  }

  if (filters.endDate !== undefined) {
    parseLeaveDate(filters.endDate);
  }

  if (
    filters.startDate !== undefined &&
    filters.endDate !== undefined &&
    filters.startDate > filters.endDate
  ) {
    throw new BadRequestException(
      'تاریخ پایان فیلتر نمی‌تواند قبل از تاریخ شروع باشد.',
    );
  }

  return {
    ...(filters.status !== undefined && {
      status: filters.status,
    }),
    ...(filters.leaveType !== undefined && {
      leaveType: filters.leaveType,
    }),

    // درخواست باید در ابتدای بازه جست‌وجو هنوز تمام نشده باشد.
    ...(filters.startDate !== undefined && {
      endDate: { gte: filters.startDate },
    }),

    // درخواست باید حداکثر تا انتهای بازه جست‌وجو شروع شده باشد.
    ...(filters.endDate !== undefined && {
      startDate: { lte: filters.endDate },
    }),
  };
}
