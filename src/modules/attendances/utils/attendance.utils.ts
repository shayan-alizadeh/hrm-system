import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';

import { Prisma } from '../../../../generated/prisma/client.js';
import { PrismaService } from '../../../prisma/prisma.service.js';

const MAX_TRANSACTION_ATTEMPTS = 3;
const MAX_NOTES_LENGTH = 250;

// استفاده از fa-IR-u-nu-latn برای اطمینان از خروجی اعداد لاتین در تمامی محیط‌ها
const jalaliFormatter = new Intl.DateTimeFormat('fa-IR-u-nu-latn', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  calendar: 'persian',
  timeZone: 'Asia/Tehran',
});

/**
 * تاریخ شمسی را با جداکننده و ارقام ثابت تولید می‌کند.
 * استخراج اجزا مانع وابستگی به ترتیب نمایشی و جداکننده locale می‌شود.
 */
export function getTehranJalaliDate(date: Date): string {
  const parts = jalaliFormatter.formatToParts(date);

  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  const day = parts.find((part) => part.type === 'day')?.value;

  if (!year || !month || !day) {
    throw new InternalServerErrorException(
      'خطای سیستمی: امکان تولید تاریخ شمسی وجود ندارد.',
    );
  }

  return `${year.padStart(4, '0')}/${month.padStart(2, '0')}/${day.padStart(2, '0')}`;
}

/**
 * قالب لازم برای ذخیره و مقایسه رشته‌ای تاریخ را کنترل می‌کند.
 * اعتبار کامل تقویمی، از جمله کبیسه اسفند، باید در DTO بررسی شود.
 */
export function assertAttendanceDate(value: string): void {
  if (
    typeof value !== 'string' ||
    !/^\d{4}\/(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])$/.test(value)
  ) {
    throw new BadRequestException(
      'تاریخ باید با قالب YYYY/MM/DD و ارقام انگلیسی ارسال شود.',
    );
  }
}

/**
 * هر دو حد بازه در یک شرط قرار می‌گیرند تا یکدیگر را بازنویسی نکنند.
 */
export function buildAttendanceDateFilter(
  startDate?: string,
  endDate?: string,
): { gte?: string; lte?: string } {
  if (startDate !== undefined) {
    assertAttendanceDate(startDate);
  }

  if (endDate !== undefined) {
    assertAttendanceDate(endDate);
  }

  if (startDate !== undefined && endDate !== undefined && startDate > endDate) {
    throw new BadRequestException(
      'تاریخ شروع نمی‌تواند بعد از تاریخ پایان باشد.',
    );
  }

  return {
    ...(startDate !== undefined && { gte: startDate }),
    ...(endDate !== undefined && { lte: endDate }),
  };
}

/**
 * محدودیت روی متن نهایی اعمال می‌شود، نه فقط یادداشت تازه دریافت‌شده.
 * Array.from تعداد code pointها را می‌شمارد.
 */
export function validateAttendanceNotes(
  notes: string | null | undefined,
): string | null {
  if (notes === undefined || notes === null) {
    return null;
  }

  if (typeof notes !== 'string') {
    throw new BadRequestException('یادداشت باید یک رشته متنی باشد.');
  }

  if (Array.from(notes).length > MAX_NOTES_LENGTH) {
    throw new BadRequestException(
      'مجموع یادداشت‌های این رکورد نمی‌تواند بیشتر از ۲۵۰ کاراکتر باشد.',
    );
  }

  return notes;
}

/**
 * رفتار قبلی افزودن یادداشت حفظ شده است:
 * مقدار خالی یا null یادداشت موجود را پاک نمی‌کند.
 */
export function appendAttendanceNotes(
  current: string | null,
  incoming: string | null | undefined,
  byManager = false,
): string | null {
  const newNote = validateAttendanceNotes(incoming);

  if (!newNote) {
    return current;
  }

  const addition = byManager ? `یادداشت مدیر: ${newNote}` : newNote;

  const separator = byManager ? ' | ' : ' - ';

  return validateAttendanceNotes(
    current ? `${current}${separator}${addition}` : addition,
  );
}

export function parseAttendanceTime(value: string, fieldName: string): Date {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new BadRequestException(`${fieldName} معتبر نیست.`);
  }

  const date = new Date(value);

  if (!Number.isFinite(date.getTime())) {
    throw new BadRequestException(`${fieldName} معتبر نیست.`);
  }

  return date;
}

/**
 * تردد بسته باید ورود داشته باشد و خروج آن قبل از ورود نباشد.
 * برابر بودن دو زمان، مطابق نبود منع صریح در قرارداد فعلی، مجاز است.
 */
export function assertAttendanceTimes(
  checkIn: Date | null,
  checkOut: Date | null,
): void {
  if (checkOut !== null && checkIn === null) {
    throw new BadRequestException('ثبت ساعت خروج بدون ساعت ورود مجاز نیست.');
  }

  if (
    checkIn !== null &&
    checkOut !== null &&
    checkOut.getTime() < checkIn.getTime()
  ) {
    throw new BadRequestException('ساعت خروج نمی‌تواند قبل از ساعت ورود باشد.');
  }
}

/**
 * تمام دسترسی‌های callback باید از tx انجام شوند.
 * callback به علت retry نباید اثر خارجی مانند ارسال پیام داشته باشد.
 */
export async function runAttendanceTransaction<T>(
  prisma: PrismaService,
  operation: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  for (let attempt = 0; attempt < MAX_TRANSACTION_ATTEMPTS; attempt += 1) {
    try {
      return await prisma.$transaction(operation, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      });
    } catch (error: unknown) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError)) {
        throw error;
      }

      if (error.code === 'P2025') {
        throw new NotFoundException(
          'رکورد حضور و غیاب یافت نشد یا حذف شده است.',
        );
      }

      if (error.code !== 'P2034') {
        throw error;
      }

      if (attempt === MAX_TRANSACTION_ATTEMPTS - 1) {
        throw new ServiceUnavailableException(
          'عملیات به‌دلیل درخواست‌های هم‌زمان انجام نشد؛ دوباره تلاش کنید.',
        );
      }
    }
  }

  throw new ServiceUnavailableException(
    'عملیات حضور و غیاب موقتاً قابل انجام نیست.',
  );
}
