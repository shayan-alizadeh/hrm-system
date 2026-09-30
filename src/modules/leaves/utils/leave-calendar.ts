import { BadRequestException } from '@nestjs/common';
import { d2g, d2j, isValidJalaaliDate, j2d } from 'jalaali-js';

import type { Prisma } from '../../../../generated/prisma/client.js';

export interface LeaveDayCalculation {
  totalDays: number;
  daysByYear: Map<number, number>;
}

/**
 * قالب ثابت برای مقایسه رشته‌ای تاریخ‌ها در دیتابیس الزامی است.
 * محدوده سال با اعتبارسنجی فعلی پروژه هماهنگ است.
 */
export function parseLeaveDate(value: unknown) {
  if (typeof value !== 'string') {
    throw new BadRequestException('تاریخ باید رشته متنی باشد.');
  }

  const match = /^(1[34]\d{2})\/(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])$/.exec(
    value,
  );

  if (!match) {
    throw new BadRequestException(
      'فرمت تاریخ باید yyyy/mm/dd و سال بین ۱۳۰۰ و ۱۴۹۹ باشد.',
    );
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (!isValidJalaaliDate(year, month, day)) {
    throw new BadRequestException('تاریخ شمسی معتبر نیست.');
  }

  return {
    year,
    month,
    day,
    dayNumber: j2d(year, month, day),
  };
}

export function assertLeaveYear(year: number): void {
  if (!Number.isInteger(year) || year < 1300 || year > 1499) {
    throw new BadRequestException('سال باید عددی بین ۱۳۰۰ و ۱۴۹۹ باشد.');
  }
}

export function getCurrentTehranJalaliYear(): number {
  const formatter = new Intl.DateTimeFormat('fa-IR', {
    calendar: 'persian',
    numberingSystem: 'latn',
    timeZone: 'Asia/Tehran',
    year: 'numeric',
  });

  const yearPart = formatter
    .formatToParts(new Date())
    .find((part) => part.type === 'year');

  const year = Number(yearPart?.value);
  assertLeaveYear(year);

  return year;
}

/**
 * روزهای قابل کسر را مطابق تقویم جاری محاسبه می‌کند.
 * تعطیلات یک بار خوانده می‌شوند و هر روز به سال خودش تخصیص می‌یابد.
 */
export async function calculateLeaveDays(
  client: Pick<Prisma.TransactionClient, 'holiday'>,
  startDate: string,
  endDate: string,
): Promise<LeaveDayCalculation> {
  const start = parseLeaveDate(startDate);
  const end = parseLeaveDate(endDate);

  if (end.dayNumber < start.dayNumber) {
    throw new BadRequestException(
      'تاریخ پایان نمی‌تواند قبل از تاریخ شروع باشد.',
    );
  }

  const holidays = await client.holiday.findMany({
    where: {
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: { date: true },
  });

  const holidayDates = new Set(holidays.map((holiday) => holiday.date));
  const daysByYear = new Map<number, number>();
  let totalDays = 0;

  for (
    let dayNumber = start.dayNumber;
    dayNumber <= end.dayNumber;
    dayNumber += 1
  ) {
    const { jy, jm, jd } = d2j(dayNumber);
    const { gy, gm, gd } = d2g(dayNumber);

    const dateString =
      `${jy}/${String(jm).padStart(2, '0')}/` + String(jd).padStart(2, '0');

    // UTC فقط برای تعیین روز هفته استفاده می‌شود، نه زمان محلی تردد.
    const weekDay = new Date(Date.UTC(gy, gm - 1, gd)).getUTCDay();
    const isFriday = weekDay === 5;

    if (isFriday || holidayDates.has(dateString)) {
      continue;
    }

    totalDays += 1;
    daysByYear.set(jy, (daysByYear.get(jy) ?? 0) + 1);
  }

  if (totalDays === 0) {
    throw new BadRequestException(
      'بازه انتخاب‌شده هیچ روز قابل کسر مرخصی ندارد.',
    );
  }

  return { totalDays, daysByYear };
}

/**
 * ایجاد موجودی باید داخل runLeaveTransaction انجام شود.
 * سهمیه اولیه از مقدار پیش‌فرض مدل Prisma دریافت می‌شود.
 */
export async function ensureLeaveBalance(
  tx: Prisma.TransactionClient,
  userId: number,
  year: number,
) {
  const balance = await tx.leaveBalance.findUnique({
    where: {
      userId_year: { userId, year },
    },
  });

  if (balance) {
    return balance;
  }

  return tx.leaveBalance.create({
    data: { userId, year },
  });
}
