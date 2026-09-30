import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

const MAX_DATABASE_ID = 2_147_483_647;

/**
 * شناسه مسیر را به عدد صحیح مثبت تبدیل می‌کند.
 *
 * سقف مقدار با ستون‌های Int فعلی در MySQL هماهنگ است.
 * ورودی نامعتبر پیش از رسیدن به Prisma با پاسخ 400 رد می‌شود.
 */
@Injectable()
export class ParseIdPipe implements PipeTransform<string, number> {
  transform(value: string): number {
    if (typeof value !== 'string' || !/^\d+$/.test(value)) {
      throw new BadRequestException('شناسه باید یک عدد صحیح مثبت باشد.');
    }

    const id = Number(value);

    if (!Number.isSafeInteger(id) || id < 1 || id > MAX_DATABASE_ID) {
      throw new BadRequestException('شناسه خارج از محدوده مجاز است.');
    }

    return id;
  }
}
