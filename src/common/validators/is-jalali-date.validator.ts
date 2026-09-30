import { registerDecorator } from 'class-validator';
import type { ValidationOptions } from 'class-validator';
import { isValidJalaaliDate } from 'jalaali-js';

/**
 * تاریخ شمسی با ارقام انگلیسی و قالب ثابت YYYY/MM/DD.
 * محدوده سال ۱۳۰۰ تا ۱۴۹۹ مطابق قرارداد قبلی پروژه حفظ شده است.
 */
export function isValidJalaliDateString(value: unknown): value is string {
  if (typeof value !== 'string') {
    return false;
  }

  const match =
    /^((?:13|14)\d{2})\/(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])$/.exec(value);

  if (!match) {
    return false;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  return isValidJalaaliDate(year, month, day);
}

/**
 * علاوه بر شکل رشته، وجود واقعی روز در تقویم شمسی را بررسی می‌کند.
 */
export function IsJalaliDate(options?: ValidationOptions): PropertyDecorator {
  return (target: object, propertyKey: string | symbol): void => {
    registerDecorator({
      name: 'isJalaliDate',
      target: target.constructor,
      propertyName: String(propertyKey),
      options,
      validator: {
        validate(value: unknown): boolean {
          return isValidJalaliDateString(value);
        },
        defaultMessage(): string {
          return 'تاریخ باید یک تاریخ شمسی معتبر با قالب YYYY/MM/DD باشد.';
        },
      },
    });
  };
}
