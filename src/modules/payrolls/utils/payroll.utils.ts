import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import jalaali from 'jalaali-js';
import { Prisma } from '../../../../generated/prisma/client.js';
import { PrismaService } from '../../../prisma/prisma.service.js';

export interface TaxBand {
  minIncome: number;
  maxIncome: number | null;
  percentage: number;
}

const { isValidJalaaliDate, jalaaliMonthLength } = jalaali;

/**
 * خطاهای شناخته‌شده Prisma را بدون وابستگی به متن پیام بررسی می‌کند.
 */
export function isPrismaError(error: unknown, code: string): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError && error.code === code
  );
}

/**
 * فقط تعارض‌های تراکنشی قابل تکرار هستند.
 * callback نباید شامل ارسال پیام، فراخوانی بانک یا اثر جانبی خارجی باشد.
 */
export async function runSerializable<T>(
  prisma: PrismaService,
  operation: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await prisma.$transaction(operation, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      });
    } catch (error: unknown) {
      if (!isPrismaError(error, 'P2034')) {
        throw error;
      }

      if (attempt === maxAttempts) {
        throw new ConflictException(
          'اطلاعات هم‌زمان تغییر کرده است. لطفاً دوباره تلاش کنید.',
        );
      }
    }
  }

  throw new ConflictException('اجرای تراکنش تکمیل نشد.');
}

/**
 * نبود رکورد در لحظه ویرایش یا حذف را به پاسخ HTTP مناسب تبدیل می‌کند.
 */
export function rethrowRecordError(error: unknown, message: string): never {
  if (isPrismaError(error, 'P2025')) {
    throw new NotFoundException(message);
  }

  throw error;
}

export function assertPayrollYear(year: number): void {
  // هماهنگ با بازه تاریخ‌های شمسی پذیرفته‌شده در سایر DTOهای پروژه.
  if (!Number.isInteger(year) || year < 1300 || year > 1499) {
    throw new BadRequestException('سال باید عددی بین ۱۳۰۰ و ۱۴۹۹ باشد.');
  }
}

export function getPayrollPeriod(year: number, month: number) {
  assertPayrollYear(year);

  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new BadRequestException('ماه باید عددی بین ۱ و ۱۲ باشد.');
  }

  const daysInMonth = jalaaliMonthLength(year, month);
  const prefix = `${year}/${String(month).padStart(2, '0')}`;

  return {
    daysInMonth,
    startDate: `${prefix}/01`,
    endDate: `${prefix}/${daysInMonth}`,
  };
}

/**
 * مقایسه رشته‌ای تاریخ فقط برای تاریخ معتبر با قالب ثابت قابل اتکاست.
 */
export function assertJalaliDate(value: string): void {
  const match = /^(1[34]\d{2})\/(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])$/.exec(
    value,
  );

  if (
    !match ||
    !isValidJalaaliDate(Number(match[1]), Number(match[2]), Number(match[3]))
  ) {
    throw new BadRequestException(
      'یکی از تاریخ‌های قرارداد یا مرخصی نامعتبر است.',
    );
  }
}

/**
 * Decimal برای محاسبات میانی استفاده می‌شود؛ نوع ستون‌های فعلی تغییر نمی‌کند.
 */
export function nonNegativeDecimal(
  value: number | Prisma.Decimal,
  label: string,
): Prisma.Decimal {
  const decimal = new Prisma.Decimal(value);

  if (
    !decimal.isFinite() ||
    decimal.isNegative() ||
    decimal.greaterThan(Number.MAX_SAFE_INTEGER)
  ) {
    throw new BadRequestException(`${label} خارج از محدوده مجاز است.`);
  }

  return decimal;
}

/**
 * سازگاری با ستون‌های Float و پاسخ عددی API فعلی.
 * این تبدیل، جایگزین مهاجرت ستون‌های مالی به Decimal نیست.
 */
export function toStoredNumber(value: Prisma.Decimal): number {
  if (!value.isFinite() || value.abs().greaterThan(Number.MAX_SAFE_INTEGER)) {
    throw new BadRequestException('مبلغ محاسبه‌شده خارج از محدوده مجاز است.');
  }

  return value.toNumber();
}

/**
 * پله‌ها به صورت بازه‌های متوالی با مرز مشترک مجاز هستند.
 * فاصله بین پله‌ها ممنوع نشده؛ رفتار فعلی آن، محاسبه نشدن مالیات آن بخش است.
 */
export function assertValidTaxBands(bands: readonly TaxBand[]): void {
  for (const band of bands) {
    nonNegativeDecimal(band.minIncome, 'کف درآمد');

    if (band.maxIncome !== null) {
      nonNegativeDecimal(band.maxIncome, 'سقف درآمد');

      if (band.maxIncome <= band.minIncome) {
        throw new BadRequestException('سقف درآمد باید از کف درآمد بیشتر باشد.');
      }
    }

    if (
      !Number.isFinite(band.percentage) ||
      band.percentage < 0 ||
      band.percentage > 100
    ) {
      throw new BadRequestException('درصد مالیات باید عددی بین صفر و صد باشد.');
    }
  }

  const sorted = [...bands].sort((a, b) => a.minIncome - b.minIncome);

  for (let index = 1; index < sorted.length; index += 1) {
    const previous = sorted[index - 1];
    const current = sorted[index];

    if (previous.maxIncome === null || current.minIncome < previous.maxIncome) {
      throw new BadRequestException(
        'پله‌های مالیاتی یک سال نباید هم‌پوشانی داشته باشند.',
      );
    }
  }
}
