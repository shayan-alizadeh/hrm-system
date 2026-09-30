import { ConflictException } from '@nestjs/common';

import { Prisma } from '../../../../generated/prisma/client.js';
import { PrismaService } from '../../../prisma/prisma.service.js';

/**
 * اجرای اتمیک تغییر وضعیت درخواست و موجودی مرخصی.
 *
 * callback ممکن است تکرار شود؛ بنابراین نباید شامل ارسال پیام،
 * ایمیل یا سایر اثرهای جانبی خارج از دیتابیس باشد.
 */
export async function runLeaveTransaction<T>(
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
      const retryable =
        error instanceof Prisma.PrismaClientKnownRequestError &&
        (error.code === 'P2034' || error.code === 'P2002');

      if (!retryable) {
        throw error;
      }

      if (attempt === maxAttempts) {
        throw new ConflictException(
          'اطلاعات مرخصی هم‌زمان تغییر کرده است. لطفاً دوباره تلاش کنید.',
        );
      }
    }
  }

  throw new ConflictException('عملیات مرخصی تکمیل نشد.');
}
