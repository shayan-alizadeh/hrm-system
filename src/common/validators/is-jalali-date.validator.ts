import { registerDecorator, type ValidationOptions } from 'class-validator';
import jalaali from 'jalaali-js';

const { isValidJalaaliDate } = jalaali;

/**
 * بررسی قالب ثابت تاریخ و معتبر بودن آن در تقویم شمسی.
 * محدوده سال مطابق قرارداد فعلی API، از ۱۳۰۰ تا ۱۴۹۹ است.
 */
export function isValidJalaliDateString(value: unknown): value is string {
  if (typeof value !== 'string') {
    return false;
  }

  const match = /^(1[34]\d{2})\/(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])$/.exec(
    value,
  );

  if (!match) {
    return false;
  }

  return isValidJalaaliDate(
    Number(match[1]),
    Number(match[2]),
    Number(match[3]),
  );
}

/**
 * اعتبارسنج مشترک تاریخ شمسی برای DTOها.
 * اختیاری بودن فیلد باید جداگانه در DTO مشخص شود.
 */
export function IsJalaliDate(
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  return (target: object, propertyKey: string | symbol): void => {
    registerDecorator({
      name: 'isJalaliDate',
      target: target.constructor,
      propertyName: String(propertyKey),
      options: validationOptions,
      validator: {
        validate(value: unknown): boolean {
          return isValidJalaliDateString(value);
        },

        defaultMessage(): string {
          return 'تاریخ باید شمسی معتبر با قالب yyyy/mm/dd باشد.';
        },
      },
    });
  };
}
