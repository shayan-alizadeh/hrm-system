import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
}

@Injectable()
export class TransformResponseInterceptor<T> implements NestInterceptor<
  T,
  Response<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    return next.handle().pipe(
      map((data) => {
        // اگر response قبلاً فرمت شده باشد، آن را برمی‌گردانیم
        if (data && typeof data === 'object' && 'success' in data) {
          return data;
        }

        // برای response های خالی (مثل DELETE با 204)
        if (response.statusCode === 204) {
          // تغییر status code به 200 برای داشتن response body
          response.statusCode = 200;
          return {
            success: true,
            data: null,
            message: this.getDefaultMessage(request.method, 204),
            timestamp: new Date().toISOString(),
          };
        }

        // برای response های null یا undefined
        if (data === null || data === undefined) {
          return {
            success: true,
            data: null,
            message: this.getDefaultMessage(
              request.method,
              response.statusCode,
            ),
            timestamp: new Date().toISOString(),
          };
        }

        // فرمت استاندارد برای response های موفق
        return {
          success: true,
          data: data,
          message: this.getDefaultMessage(request.method, response.statusCode),
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }

  private getDefaultMessage(method: string, statusCode: number): string {
    const messages: Record<string, Record<number, string>> = {
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
        204: 'رکورد با موفقیت حذف شد',
      },
    };

    return messages[method]?.[statusCode] || 'عملیات با موفقیت انجام شد';
  }
}
