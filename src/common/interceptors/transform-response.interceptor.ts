import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  StreamableFile,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  success: boolean;
  data: T | null;
  message?: string;
  timestamp: string;
}

interface HttpRequestContext {
  method: string;
}

interface HttpResponseContext {
  statusCode: number;
}

type InterceptorResult<T> = T | Response<T> | undefined;

const DEFAULT_MESSAGES: Readonly<
  Record<string, Readonly<Record<number, string>>>
> = {
  GET: {
    200: 'اطلاعات با موفقیت دریافت شد',
  },
  POST: {
    201: 'رکورد با موفقیت ایجاد شد',
  },
  PATCH: {
    200: 'رکورد با موفقیت به‌روزرسانی شد',
  },
  PUT: {
    200: 'رکورد با موفقیت به‌روزرسانی شد',
  },
  DELETE: {
    200: 'رکورد با موفقیت حذف شد',
  },
};

/**
 * ساختار کامل پاسخ را بررسی می‌کند تا وجود صرف فیلد success
 * باعث اشتباه‌گرفتن داده کسب‌وکار با پاسخ استاندارد نشود.
 */
function isResponseEnvelope(value: unknown): value is Response<unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    Object.prototype.hasOwnProperty.call(candidate, 'success') &&
    typeof candidate.success === 'boolean' &&
    Object.prototype.hasOwnProperty.call(candidate, 'data') &&
    candidate.data !== undefined &&
    Object.prototype.hasOwnProperty.call(candidate, 'timestamp') &&
    typeof candidate.timestamp === 'string' &&
    Number.isFinite(Date.parse(candidate.timestamp)) &&
    (candidate.message === undefined || typeof candidate.message === 'string')
  );
}

/**
 * پاسخ‌های موفق JSON را در قالب مشترک API قرار می‌دهد.
 *
 * کد وضعیت HTTP تغییر نمی‌کند. پاسخ فایل و پاسخ‌های بدون محتوا
 * از قالب‌بندی JSON مستثنا هستند. خطاهای پرتاب‌شده نیز به مسیر
 * استاندارد مدیریت exception در Nest واگذار می‌شوند.
 */
@Injectable()
export class TransformResponseInterceptor<T> implements NestInterceptor<
  T,
  InterceptorResult<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<InterceptorResult<T>> {
    // این قالب برای درخواست‌های HTTP تعریف شده است.
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const http = context.switchToHttp();
    const request = http.getRequest<HttpRequestContext>();
    const response = http.getResponse<HttpResponseContext>();

    return next.handle().pipe(
      map((data: T): InterceptorResult<T> => {
        // وضعیت نهایی پس از اجرای کنترلر خوانده می‌شود.
        const statusCode = response.statusCode;

        // این وضعیت‌ها نباید محتوای پاسخ داشته باشند.
        if (statusCode === 204 || statusCode === 205 || statusCode === 304) {
          return undefined;
        }

        // Nest باید فایل را مستقیماً برای ارسال stream دریافت کند.
        if (data instanceof StreamableFile) {
          return data;
        }

        // پاسخ redirect یا خطایی که کنترلر مستقیم برگردانده است،
        // نباید به‌عنوان پاسخ موفق قالب‌بندی شود.
        if (statusCode < 200 || statusCode >= 300) {
          return data;
        }

        // پاسخ استاندارد موجود، دوباره داخل data قرار نمی‌گیرد.
        if (isResponseEnvelope(data)) {
          return data;
        }

        return {
          success: true,
          data: data ?? null,
          message: this.getDefaultMessage(request.method, statusCode),
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }

  private getDefaultMessage(method: string, statusCode: number): string {
    return (
      DEFAULT_MESSAGES[method.toUpperCase()]?.[statusCode] ??
      'عملیات با موفقیت انجام شد'
    );
  }
}
