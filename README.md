# HR API — سامانه مدیریت منابع انسانی

بک‌اند مدیریت منابع انسانی با **NestJS، TypeScript، Prisma و MySQL** برای مدیریت دپارتمان‌ها، قراردادها، حضور و غیاب، مرخصی و حقوق کارکنان. API دارای مسیرهای جداگانه برای مدیر و کارمند، احراز هویت JWT و مستندات Swagger است.

> این مستند براساس کدها و اصلاحات بررسی‌شده پروژه تهیه شده است. مبنای رفتارها، اعمال آخرین نسخه این اصلاحات است. اجرای موفق برنامه به معنی تأیید migrationها، صحت محاسبات حقوق یا عبور تست‌های یکپارچه نیست. نسخه وابستگی‌ها و اسکریپت‌های اجرایی را از `package.json` و `package-lock.json` همان checkout بررسی کنید.

## فهرست

- [قابلیت‌ها](#features)
- [فناوری و ساختار](#architecture)
- [راه‌اندازی](#setup)
- [متغیرهای محیطی](#environment)
- [دیتابیس و migration](#database)
- [احراز هویت و دسترسی](#authentication)
- [مسیرهای API](#api)
- [نمونه درخواست‌ها](#examples)
- [قواعد داده و محاسبات](#business-rules)
- [فرانت‌اند](#frontend)
- [تست و کنترل کیفیت](#quality)
- [استقرار](#deployment)
- [رفع خطاهای متداول](#troubleshooting)
- [محدودیت‌ها و کارهای باقی‌مانده](#limitations)

<a id="features"></a>
## قابلیت‌ها

| ماژول | کارکرد |
| --- | --- |
| Auth | ثبت‌نام، ورود، دریافت و نوسازی توکن و خروج |
| Departments | مدیریت دپارتمان‌ها و مشاهده اطلاعات آن‌ها |
| Attendance | ثبت ورود و خروج، گزارش تردد و اصلاح مدیریتی |
| Contracts | ثبت و ویرایش قرارداد، مشاهده قرارداد فعال و تاریخچه |
| Leaves | ثبت، لغو، تأیید و رد مرخصی و نگهداری موجودی سالانه |
| Holidays | ثبت و مدیریت تعطیلات تقویم سازمان |
| Payroll | صدور فیش براساس قرارداد، مرخصی بدون حقوق و قواعد مالیاتی |
| Tax Rules | تعریف و ویرایش پله‌های مالیاتی سالانه |

کارمند به قراردادها، درخواست‌های مرخصی، ترددها و فیش‌های خودش دسترسی دارد. مسیرهای مدیریتی با نقش `MANAGER` محافظت می‌شوند. کنترل مالکیت در سرویس‌ها مکمل کنترل نقش در Guardها است.

<a id="architecture"></a>
## فناوری و ساختار

| بخش | فناوری |
| --- | --- |
| سرور | NestJS و TypeScript |
| دیتابیس | MySQL، Prisma Client و `@prisma/adapter-mariadb` |
| احراز هویت | JWT، Passport و bcrypt برای رمز عبور |
| اعتبارسنجی | `class-validator` و `class-transformer` |
| مستندات API | `@nestjs/swagger` |
| تقویم | `jalaali-js` و `Intl` |
| فرانت‌اند | فایل‌های HTML و منابع موجود در `frontend/` |

نام adapter به معنی لزوم استفاده از MariaDB به‌جای MySQL نیست. نسخه‌های دیتابیس و بسته‌ها باید با تنظیمات پروژه سازگار باشند.

| مسیر | مسئولیت |
| --- | --- |
| `src/main.ts` | راه‌اندازی، CORS، prefix، اعتبارسنجی و interceptor |
| `src/app.module.ts` | اتصال ماژول‌ها و Guardهای سراسری |
| `src/config/` | اعتبارسنجی محیط و تنظیم Swagger |
| `src/common/` | decoratorها، pipeها، validatorها و interceptorهای مشترک |
| `src/modules/auth/` | احراز هویت و کنترل نقش |
| `src/modules/departments/` | دپارتمان‌ها |
| `src/modules/attendances/` | حضور و غیاب |
| `src/modules/contracts/` | قراردادها |
| `src/modules/leaves/` | مرخصی، موجودی و تعطیلات |
| `src/modules/payrolls/` | فیش حقوقی و مالیات |
| `src/prisma/` | سرویس و ماژول اتصال دیتابیس |
| `prisma/schema.prisma` | مدل‌ها، روابط و ایندکس‌ها |
| `prisma/migrations/` | تاریخچه تغییر ساختار دیتابیس |
| `prisma.config.ts` | تنظیمات Prisma CLI |
| `generated/prisma/` | خروجی تولیدشده Prisma؛ ویرایش دستی نشود |
| `frontend/` | صفحات ورود، داشبورد و پنل‌ها |
| `test/` | فایل‌های تست موجود پروژه |

Controller مسئول قرارداد HTTP، DTO مسئول اعتبارسنجی ورودی و Service مسئول منطق کسب‌وکار و دسترسی به داده است.

<a id="setup"></a>
## راه‌اندازی

### ۱. پیش‌نیازها

- Node.js سازگار با نسخه وابستگی‌های پروژه؛ محیط گزارش‌شده توسعه، `22.14.0` بوده است. این عدد اعلام حداقل نسخه پشتیبانی‌شده نیست.
- npm و دیتابیس MySQL در دسترس.
- دیتابیس و حساب اتصال با مجوزهای متناسب با محیط توسعه یا اجرا.

دستورها را در ریشه پروژه، کنار `package.json`، اجرا کنید.

### ۲. نصب وابستگی‌ها

```bash
npm ci
```

از lockfile موجود استفاده کنید. در صورت ناسازگاری `package.json` و lockfile، علت تغییرات را بررسی کنید؛ حذف lockfile راه‌حل پیش‌فرض نیست.

### ۳. تنظیم محیط

فایل `.env` را طبق بخش بعد بسازید. نمونه شامل placeholder است و پیش از اجرا باید تکمیل شود.

برای تولید دو secret مستقل:

```bash
node -e "const {randomBytes}=require('node:crypto'); console.log('JWT_ACCESS_SECRET='+randomBytes(32).toString('hex')); console.log('JWT_REFRESH_SECRET='+randomBytes(32).toString('hex'));"
```

دو خط خروجی را در `.env` قرار دهید. هر secret تولیدشده ۶۴ کاراکتر hexadecimal دارد. کلید واقعی را در Git یا مستندات ثبت نکنید.

### ۴. آماده‌سازی Prisma و دیتابیس

پس از ایجاد دیتابیس و تکمیل تنظیمات اتصال، روی دیتابیس توسعه:

```bash
npx prisma validate
npx prisma generate
npx prisma migrate dev
```

این دستور migration برای محیط توسعه است. اگر Prisma پیشنهاد reset دیتابیس دارای داده داد، پیش از تأیید علت drift و امکان از دست رفتن داده را بررسی کنید.

### ۵. اجرای سرور

اسکریپت‌های موجود را ببینید:

```bash
npm run
```

اگر اسکریپت `start:dev` در پروژه تعریف شده است:

```bash
npm run start:dev
```

با Nest CLI نصب‌شده در وابستگی‌های پروژه، اجرای مستقیم نیز ممکن است:

```bash
npx nest start --watch
```

با `PORT=3000`، آدرس پایه API:

```text
http://localhost:3000/api/v1
```

برای مسیر ریشه `/` یا `/api/v1` لزوماً handler تعریف نشده است؛ دریافت 404 از این مسیرها به‌تنهایی نشانه خرابی سرور نیست.

<a id="environment"></a>
## متغیرهای محیطی

نمونه `.env` برای توسعه محلی:

```dotenv
NODE_ENV=development
PORT=3000
APP_NAME="HR Management System"

CORS_ORIGINS="http://localhost:8080"
SWAGGER_ENABLED=true

DATABASE_URL="mysql://hr_app:REPLACE_WITH_DB_PASSWORD@localhost:3306/hrm"
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_USER=hr_app
DATABASE_PASSWORD="REPLACE_WITH_DB_PASSWORD"
DATABASE_NAME=hrm
DATABASE_CONNECTION_LIMIT=5

JWT_ACCESS_SECRET="REPLACE_WITH_GENERATED_ACCESS_SECRET"
JWT_REFRESH_SECRET="REPLACE_WITH_GENERATED_REFRESH_SECRET"
ACCESS_TOKEN_EXPIRE=15m
REFRESH_TOKEN_EXPIRE=14d
JWT_ISSUER=hr-api
JWT_AUDIENCE=hr-api-client
```

| متغیر | کاربرد |
| --- | --- |
| `NODE_ENV` | محیط `development`، `test` یا `production` |
| `PORT` | پورت HTTP سرور |
| `APP_NAME` | نام برنامه در تنظیمات و لاگ |
| `CORS_ORIGINS` | originهای مجاز مرورگر، جداشده با کاما |
| `SWAGGER_ENABLED` | فعال یا غیرفعال کردن Swagger |
| `DATABASE_URL` | رشته اتصال مورد استفاده تنظیمات Prisma CLI |
| `DATABASE_HOST` تا `DATABASE_NAME` | اطلاعات اتصال adapter در `PrismaService` |
| `DATABASE_CONNECTION_LIMIT` | سقف pool اتصال هر نمونه برنامه |
| `JWT_ACCESS_SECRET` | کلید امضای access token؛ حداقل ۳۲ کاراکتر |
| `JWT_REFRESH_SECRET` | کلید مستقل refresh token؛ حداقل ۳۲ کاراکتر |
| `ACCESS_TOKEN_EXPIRE` | عمر access token، مانند `15m` |
| `REFRESH_TOKEN_EXPIRE` | عمر refresh token، مانند `14d` |
| `JWT_ISSUER` و `JWT_AUDIENCE` | مقادیر هماهنگ صدور و اعتبارسنجی JWT |

نکات تنظیمات:

- `DATABASE_URL` و تنظیمات تفکیک‌شده اتصال باید به یک دیتابیس اشاره کنند.
- کاراکترهای ویژه رمز عبور در URL باید percent-encode شوند؛ مقدار `DATABASE_PASSWORD` رمز اصلی است.
- بارگذاری `.env` برای برنامه توسط ConfigModule، به‌تنهایی تضمین‌کننده بارگذاری آن برای Prisma CLI نیست؛ `prisma.config.ts` باید محیط را بارگذاری کند، مثلاً با `import 'dotenv/config'`.
- origin شامل scheme، host و port است؛ برای نمونه `http://localhost:8080` با `http://127.0.0.1:8080` یکسان نیست.
- برای درخواست credentialed، originهای مشخص تنظیم کنید؛ CORS جایگزین احراز هویت یا کنترل دسترسی نیست.
- پس از تغییر secretها یا متغیرهای محیطی، برنامه را کامل restart کنید. تغییر secretها، توکن‌های قبلی مربوط به آن کلید را نامعتبر می‌کند.

<a id="database"></a>
## دیتابیس و migration

### مدل‌های اصلی

`User`، `Department`، `RefreshToken`، `Attendance`، `Contract`، `Payroll`، `TaxRule`، `LeaveRequest`، `LeaveBalance` و `Holiday`.

قواعد ساختاری مهم در Schema اصلاح‌شده:

- شماره موبایل، کد ملی غیر null، شماره قرارداد و تاریخ تعطیلی یکتا هستند.
- ترکیب `userId + year + month` در فیش حقوقی یکتا است.
- ترکیب `userId + year` در موجودی مرخصی یکتا است.
- حضور و غیاب روزانه یکتا نیست؛ چند نوبت تردد در یک روز ممکن است.
- حذف کاربر دارای سوابق HR با `Restrict` محدود می‌شود؛ نشست‌های احراز هویت رابطه `Cascade` دارند.
- حذف دپارتمان دارای کارمند محدود است؛ ابتدا وابستگی کاربران باید رفع شود.
- ایندکس‌های مرکب برای نشست‌های فعال، تردد باز، گزارش تاریخی، درخواست مرخصی و قراردادها در Schema تعریف شده‌اند.

### تغییر ساختار در توسعه

```bash
npx prisma format
npx prisma validate
npx prisma migrate dev --name describe_change --create-only
```

نام `describe_change` را متناسب با تغییر انتخاب کنید. SQL ساخته‌شده را از نظر حذف داده، تغییر FK، تبدیل نوع و ایندکس تکراری بررسی کنید، سپس:

```bash
npx prisma migrate dev
npx prisma generate
```

### اعمال migration آماده در محیط استقرار

```bash
npx prisma migrate deploy
```

`migrate deploy` جایگزین تولید Prisma Client نیست. Client باید در فرایند build، پیش از کامپایل برنامه تولید شود. فایل‌های migration اجراشده را بازنویسی نکنید و `migrate reset` را روی دیتابیس واقعی اجرا نکنید.

<a id="authentication"></a>
## احراز هویت و دسترسی

درخواست‌های محافظت‌شده به هدر زیر نیاز دارند:

```http
Authorization: Bearer <access-token>
```

| نقش | دامنه دسترسی |
| --- | --- |
| `EMPLOYEE` | مسیرهای کارمند و داده‌های متعلق به خودش |
| `MANAGER` | مسیرهای مدیریتی |

`MANAGER` به‌صورت خودکار شامل نقش `EMPLOYEE` نیست؛ مسیرهایی با `@Roles(EMPLOYEE)` تنها همان نقش را می‌پذیرند، مگر تنظیم مسیر تغییر کند.

نکات عملیاتی:

- endpointهای register، login و refresh عمومی هستند؛ سایر مسیرها تحت Guardهای مربوط قرار دارند.
- ثبت‌نام عمومی نباید امکان انتخاب نقش مدیر بدهد. نمونه ثبت‌نام این README فیلد `role` ندارد.
- برای ایجاد مدیر اولیه، مسیر عملیاتی کنترل‌شده لازم است؛ seed یا فرمان اختصاصی ساخت مدیر در فایل‌های بررسی‌شده ارائه نشده است. حساب مدیر پیش‌فرضی در این مستند تعریف نمی‌شود.
- access token برای درخواست API و refresh token برای نوسازی نشست استفاده می‌شود.
- در نسخه اصلاح‌شده Auth، هش refresh token با SHA-256 ذخیره می‌شود؛ رمز عبور همچنان با bcrypt هش می‌شود.
- کنترل وضعیت حساب و `tokenVersion` در اعتبارسنجی access token، با اطلاعات کاربر در دیتابیس انجام می‌شود.
- معنای دقیق ابطال access token در logout به اجرای افزایش `tokenVersion` در نسخه نهایی AuthService وابسته است؛ صرف ابطال رکورد refresh token، access token صادرشده را خودکار لغو نمی‌کند.

<a id="api"></a>
## مسیرهای API

تمام مسیرهای جدول‌ها نسبت به prefix زیر هستند:

```text
/api/v1
```

### Swagger

با `SWAGGER_ENABLED=true`:

- مدیر: `http://localhost:3000/api/v1/manager/docs`
- کارمند: `http://localhost:3000/api/v1/employee/docs`

تقسیم مستندات، جایگزین کنترل دسترسی API نیست. وجود `ApiBearerAuth` نیز به‌تنهایی به معنی محافظت از خود صفحه Swagger نیست.

### Auth

| روش | مسیر | کارکرد |
| --- | --- | --- |
| POST | `/auth/register` | ثبت‌نام |
| POST | `/auth/login` | ورود |
| POST | `/auth/refresh` | نوسازی توکن |
| POST | `/auth/logout` | خروج از نشست‌ها طبق سیاست سرویس |

### دپارتمان‌ها

| روش | مسیر | کارکرد |
| --- | --- | --- |
| GET | `/employee/departments` | مشاهده دپارتمان‌ها |
| GET | `/employee/departments/:id` | جزئیات دپارتمان |
| POST / GET | `/manager/departments` | ایجاد / فهرست |
| GET / PATCH / DELETE | `/manager/departments/:id` | جزئیات / ویرایش / حذف |

### حضور و غیاب

| روش | مسیر | کارکرد |
| --- | --- | --- |
| POST | `/employee/attendance/check-in` | ثبت ورود |
| POST | `/employee/attendance/check-out` | ثبت خروج |
| GET | `/employee/attendance` | گزارش ترددهای خود |
| GET | `/manager/attendance` | گزارش مدیریتی |
| GET / PATCH / DELETE | `/manager/attendance/:id` | جزئیات / اصلاح / حذف |

فیلترهای گزارش شامل `startDate` و `endDate` و در مسیر مدیر، `userId` هستند.

### قراردادها

| روش | مسیر | کارکرد |
| --- | --- | --- |
| GET | `/employee/contracts/my-active` | قرارداد دارای وضعیت فعال خود |
| GET | `/employee/contracts/my-history` | تاریخچه قراردادهای خود |
| POST / GET | `/manager/contracts` | ثبت / فهرست |
| GET | `/manager/contracts/active/:userId` | قرارداد فعال کارمند |
| GET / PATCH | `/manager/contracts/:id` | جزئیات / ویرایش |

فیلترهای فهرست مدیر: `userId` و `status`.

### مرخصی و تعطیلات

| روش | مسیر | کارکرد |
| --- | --- | --- |
| GET | `/employee/leaves/balance` | موجودی سال جاری خود |
| POST | `/employee/leaves/request` | ثبت درخواست |
| GET | `/employee/leaves/requests` | درخواست‌های خود |
| PATCH | `/employee/leaves/request/:id/cancel` | لغو درخواست در انتظار |
| GET | `/manager/leaves/requests` | درخواست‌های سازمان |
| GET | `/manager/leaves/request/:id` | جزئیات درخواست |
| PATCH | `/manager/leaves/request/:id/resolve` | تأیید یا رد |
| GET | `/manager/leaves/balances` | موجودی‌های ثبت‌شده کارکنان |
| POST / GET | `/manager/holidays` | ثبت / فهرست تعطیلات |
| GET / PATCH / DELETE | `/manager/holidays/:id` | جزئیات / ویرایش / حذف تعطیلی |

فیلترهای درخواست مرخصی: `status`، `leaveType`، `startDate` و `endDate`؛ `userId` فقط در مسیر مدیر اعمال می‌شود. فیلتر تعطیلات: `year`.

### حقوق و مالیات

| روش | مسیر | کارکرد |
| --- | --- | --- |
| GET | `/employee/payroll/my-payrolls` | فیش‌های خود |
| GET | `/employee/payroll/my-payrolls/:id` | جزئیات فیش خود |
| POST / GET | `/manager/payroll` | صدور / فهرست فیش‌ها |
| GET / DELETE | `/manager/payroll/:id` | جزئیات / حذف فیش |
| PATCH | `/manager/payroll/:id/status` | تغییر وضعیت |
| POST / GET | `/manager/tax-rules` | ثبت / فهرست پله‌های مالیاتی |
| GET / PATCH / DELETE | `/manager/tax-rules/:id` | جزئیات / ویرایش / حذف پله |

فیلترهای فیش: `year`، `month`، `status` و در مسیر مدیر `userId`. فیلتر پله‌های مالیاتی: `year`.

<a id="examples"></a>
## نمونه درخواست‌ها

بدنه JSON با هدر `Content-Type: application/json` ارسال شود. شناسه‌های نمونه باید با رکورد واقعی جایگزین شوند. رمز نمونه صرفاً نمایشی است.

### ثبت‌نام

```http
POST /api/v1/auth/register
Content-Type: application/json
```

```json
{
  "mobile": "09123456789",
  "password": "Example-Only-Password!42",
  "firstName": "علی",
  "lastName": "رضایی"
}
```

### ورود

```http
POST /api/v1/auth/login
Content-Type: application/json
```

```json
{
  "mobile": "09123456789",
  "password": "Example-Only-Password!42"
}
```

### ثبت ورود کارمند

```http
POST /api/v1/employee/attendance/check-in
Authorization: Bearer <employee-access-token>
Content-Type: application/json
```

```json
{
  "notes": "شروع کار"
}
```

در صورت نبود `attendanceDate`، تاریخ روز کاری از منطق سرور گرفته می‌شود.

### درخواست مرخصی

```http
POST /api/v1/employee/leaves/request
Authorization: Bearer <employee-access-token>
Content-Type: application/json
```

```json
{
  "leaveType": "ANNUAL",
  "startDate": "1405/07/11",
  "endDate": "1405/07/12",
  "reason": "رسیدگی به امور شخصی"
}
```

### تأیید مرخصی

```http
PATCH /api/v1/manager/leaves/request/12/resolve
Authorization: Bearer <manager-access-token>
Content-Type: application/json
```

```json
{
  "status": "APPROVED",
  "managerNote": "با درخواست موافقت شد."
}
```

### صدور فیش

```http
POST /api/v1/manager/payroll
Authorization: Bearer <manager-access-token>
Content-Type: application/json
```

```json
{
  "userId": 5,
  "year": 1405,
  "month": 7
}
```

صدور به قرارداد مناسب و قواعد مالیاتی ثبت‌شده نیاز دارد؛ مبالغ فیش مستقیماً از کلاینت دریافت نمی‌شوند.

### ثبت وضعیت پرداخت

```http
PATCH /api/v1/manager/payroll/20/status
Authorization: Bearer <manager-access-token>
Content-Type: application/json
```

```json
{
  "status": "PAID"
}
```

تغییر وضعیت، اعلام ثبت پرداخت در سامانه است و تراکنش بانکی انجام نمی‌دهد.

### ساختار پاسخ

در نسخه اصلاح‌شده interceptor، پاسخ معمول موفق در envelope زیر قرار می‌گیرد:

```json
{
  "success": true,
  "data": {},
  "message": "عملیات با موفقیت انجام شد",
  "timestamp": "2026-10-01T06:00:00.000Z"
}
```

شکل `data` به endpoint بستگی دارد و بعضی کنترلرها پیام خود را نیز داخل داده برمی‌گردانند. پاسخ بدون بدنه و خروجی فایل از قواعد مخصوص خود پیروی می‌کنند. قالب یکسان برای خطاها تضمین نشده است؛ interceptor موفقیت، جایگزین Exception Filter نیست.

خطاهای رایج: `400` برای ورودی یا وضعیت نامعتبر، `401` برای احراز هویت، `403` برای نقش غیرمجاز، `404` برای رکورد یافت‌نشده و `409` برای تداخل یا تعارض داده.

<a id="business-rules"></a>
## قواعد داده و محاسبات

### تاریخ و اعداد

- تاریخ‌های کاری با قالب ثابت `YYYY/MM/DD`، تقویم شمسی و ارقام انگلیسی ارسال می‌شوند؛ مانند `1405/07/11`.
- بازه سال فعلی validatorها `1300..1499` است؛ این محدودیت برنامه است، نه محدودیت عمومی تقویم شمسی.
- اعتبارسنجی، وجود واقعی تاریخ و سال کبیسه را بررسی می‌کند.
- timestampهای تردد و ثبت رویداد از نوع `DateTime` هستند و با تاریخ شمسی روز کاری یکسان نیستند.
- تعیین روز یا سال جاری سازمان در منطق اصلاح‌شده با منطقه زمانی `Asia/Tehran` انجام می‌شود.
- شناسه، سال و ماه در بدنه JSON عدد صحیح هستند. تبدیل Query تنها در DTO مربوط انجام می‌شود.
- در PATCH، نبود فیلد یعنی عدم تغییر؛ `null` فقط برای فیلدهای nullable، مانند یادداشت یا مسیر فایل قرارداد، مجاز است.

### قرارداد

- ثبت قرارداد جدید، قراردادهای فعال قبلی همان کارمند را `EXPIRED` می‌کند.
- `ACTIVE` وضعیت ثبت‌شده است؛ زمان‌بندی فعال‌سازی یا انقضای خودکار در پیاده‌سازی فعلی وجود ندارد.
- فعال‌سازی و تغییرات وابسته در تراکنش انجام می‌شوند؛ چند قرارداد فعال موجود به‌عنوان ناسازگاری گزارش می‌شود.
- ویرایش اطلاعات مالی قرارداد، فیش‌های صادرشده قبلی را خودکار محاسبه مجدد نمی‌کند.

### مرخصی

- محاسبه فعلی، جمعه‌ها و تعطیلات ثبت‌شده را از روزهای قابل کسر حذف می‌کند.
- درخواست‌های روزانه هم‌پوشان در وضعیت `PENDING` یا `APPROVED` پذیرفته نمی‌شوند.
- درخواست در انتظار، سهمیه را رزرو نمی‌کند؛ موجودی هنگام تأیید دوباره کنترل می‌شود.
- لغو کارمند فقط برای `PENDING` مجاز است. مدیر تنها نتیجه `APPROVED` یا `REJECTED` ثبت می‌کند.
- روزهای مرخصی عبوری از سال بین موجودی همان سال‌ها تقسیم می‌شوند.
- سهمیه اولیه مدل، ۲۶ روز است؛ این مقدار سیاست فعلی برنامه است و به‌تنهایی بیانگر انطباق با قوانین همه قراردادها نیست.
- اگر تعداد روزهای محاسبه‌شده هنگام تأیید با درخواست ذخیره‌شده متفاوت باشد، تأیید متوقف می‌شود.

### حقوق و دستمزد

- واحد معرفی‌شده در DTOهای مالی، ریال است. داده‌های قدیمی باید از نظر واحد بررسی شوند.
- فرمول فعلی ناخالص: حقوق پایه + حق مسکن + بن کارگری + حق اولاد.
- مبنای فعلی بیمه: حقوق پایه + حق مسکن + بن کارگری؛ نرخ فعلی ۷ درصد است.
- مبنای فعلی مالیات: حقوق ناخالص منهای بیمه؛ مالیات با پله‌های همان سال محاسبه می‌شود.
- کسر مرخصی بدون حقوق از نسبت حقوق پایه به تعداد واقعی روزهای ماه محاسبه می‌شود.
- اعشار بیمه و مجموع مالیات مطابق پیاده‌سازی فعلی حذف می‌شود؛ سیاست گرد کردن تمام اقلام هنوز یکپارچه نشده است.
- قرارداد ناقص ماه، چند قرارداد مرتبط با ماه یا مرخصی بدون حقوق عبوری از مرز ماه، در سرویس اصلاح‌شده صدور را متوقف می‌کند.
- این فرمول‌ها شرح پیاده‌سازی هستند؛ تأیید قانونی و حسابداری محاسبات محسوب نمی‌شوند.

<a id="frontend"></a>
## فرانت‌اند

صفحات موجود در `frontend/` شامل صفحات عمومی، ورود و پنل‌های کارمند و مدیر هستند. وجود این پوشه به معنی سرو خودکار آن توسط NestJS نیست.

فرانت‌اند را با یک وب‌سرور محلی مانند Live Server اجرا کنید و:

1. آدرس پایه درخواست‌ها را با پورت API هماهنگ کنید.
2. origin واقعی فرانت‌اند را در `CORS_ORIGINS` قرار دهید.
3. درخواست‌های محافظت‌شده را با access token ارسال کنید.
4. ساختار envelope پاسخ و مسیرهای نقش مربوط را رعایت کنید.

باز کردن مستقیم HTML با `file://` برای توسعه این جریان توصیه نمی‌شود. هماهنگی کامل همه صفحات فرانت‌اند با اصلاحات API در این بازبینی تأیید نشده است.

<a id="quality"></a>
## تست و کنترل کیفیت

فایل‌های `test/app.e2e-spec.ts` و `test/jest-e2e.json` در ساختار پروژه وجود دارند؛ وجود آن‌ها به معنی پوشش همه ماژول‌ها نیست.

با `npm run` نام اسکریپت‌های واقعی را بررسی کنید. در صورت تعریف، از اسکریپت‌های `build`، `lint`، `test` و `test:e2e` استفاده کنید. فرمان مستقیم ساخت با Nest CLI:

```bash
npx nest build
```

تست‌های دیتابیس باید روی دیتابیس جداگانه اجرا شوند. سناریوهای ضروری:

- جلوگیری از دسترسی کارمند به فیش، قرارداد و درخواست کارمند دیگر.
- رد تاریخ نامعتبر، شناسه اعشاری، enum نامعتبر و null غیرمجاز.
- رقابت تأیید و لغو یک مرخصی و تأیید هم‌زمان دو درخواست با موجودی محدود.
- تردد باز و ثبت هم‌زمان ورود یا خروج.
- ثبت هم‌زمان فیش، قرارداد یا تعطیلی تکراری.
- rollback فعال‌سازی قرارداد در صورت شکست ذخیره.
- ابطال و نوسازی توکن و غیرفعال شدن حساب.
- مرخصی عبوری از سال، اسفند کبیسه و تغییر تقویم تعطیلات.

در این مستند ادعایی درباره درصد پوشش، نتیجه تست‌ها یا آماده بودن برای production مطرح نشده است.

<a id="deployment"></a>
## استقرار

ترتیب پیشنهادی فرایند استقرار:

1. نصب وابستگی‌های قفل‌شده در مرحله build.
2. تولید Prisma Client و کامپایل برنامه.
3. تهیه پشتیبان و بررسی migrationها روی محیط staging.
4. اجرای `prisma migrate deploy` از فرایند کنترل‌شده استقرار.
5. اجرای entrypoint ساخته‌شده با اسکریپت واقعی production پروژه.
6. بررسی ورود، دسترسی نقش‌ها، اتصال دیتابیس و عملیات اصلی.

در محیط عملیاتی، secretها را از تنظیمات امن محیط دریافت کنید، CORS را به originهای واقعی محدود کنید و `SWAGGER_ENABLED` را متناسب با سیاست دسترسی تنظیم کنید. حساب دیتابیس زمان اجرا نباید بدون نیاز از حساب مدیر دیتابیس استفاده کند. مجوزهای اجرای migration می‌توانند با حساب runtime متفاوت باشند.

تعداد replicaها در سقف کل اتصال اثر دارد: هر نمونه برنامه pool خودش را دارد. ظرفیت دیتابیس را براساس مجموع poolها تنظیم کنید.

<a id="troubleshooting"></a>
## رفع خطاهای متداول

### JWT secret کوتاه است

```text
JWT_ACCESS_SECRET must be longer than or equal to 32 characters
```

دو کلید مستقل با دستور بخش راه‌اندازی تولید کنید. متغیرهای محیطی سیستم یا IDE را نیز بررسی کنید؛ ممکن است بر `.env` اولویت داشته باشند. شرط حداقل طول را برای عبور از خطا حذف نکنید.

### named export در jalaali-js پیدا نمی‌شود

```text
The requested module 'jalaali-js' does not provide an export named 'isValidJalaaliDate'
```

برای نسخه CommonJS مانند `jalaali-js@1.2.8` در اجرای ESM:

```ts
import jalaali from 'jalaali-js';

const { isValidJalaaliDate } = jalaali;
```

این الگو باید در تمام مصرف‌کننده‌های همین نسخه کتابخانه هماهنگ باشد. تغییر نسخه اصلی کتابخانه بدون بررسی شیوه export و تایپ‌ها انجام نشود.

### خطای TS4053 درباره TokenPair

نوع مشترک خروجی AuthService باید export شود تا در declaration عمومی کنترلر قابل ارجاع باشد. برای رفع این خطا از `any` استفاده نکنید و فیلد `user` در خروجی login را از تایپ پاسخ حذف نکنید.

### تغییر Schema در برنامه دیده نمی‌شود

وضعیت migration و دیتابیس مقصد را بررسی کنید و پس از تغییر Schema، `npx prisma generate` اجرا کنید. فایل‌های `generated/prisma/` را دستی اصلاح نکنید.

### Swagger نمایش داده نمی‌شود

مقدار `SWAGGER_ENABLED`، پورت و مسیر نقش مربوط را بررسی کنید. این پروژه مستندات جداگانه در `/api/v1/manager/docs` و `/api/v1/employee/docs` دارد.

### مرورگر خطای CORS می‌دهد

origin واقعی صفحه، شامل پورت و scheme، باید در `CORS_ORIGINS` باشد. موفق بودن درخواست در ابزارهای غیرمرورگری به معنی صحیح بودن CORS نیست.

<a id="limitations"></a>
## محدودیت‌ها و کارهای باقی‌مانده

- ستون‌های مالی هنوز `Float` هستند. استفاده از Decimal در محاسبات میانی، جایگزین مهاجرت ذخیره‌سازی و اصلاح یکپارچه سرویس‌ها و پاسخ API نیست.
- قید دیتابیسی «فقط یک قرارداد فعال» هنوز در Schema وجود ندارد؛ تضمین فعلی به مسیرهای تراکنشی سرویس وابسته است.
- فعال‌سازی قرارداد آینده، انقضای خودکار، قرارداد ناقص ماه و حقوق تاریخی نیازمند قواعد تکمیلی‌اند.
- تسهیم ذخیره‌شده روزهای مرخصی بین ماه‌ها، snapshot تقویم و محاسبه حقوق برای مرخصی عبوری از ماه تکمیل نشده‌اند.
- سابقه مدیر بررسی‌کننده، تغییر وضعیت پرداخت و ورودی‌های محاسبه فیش هنوز مدل کامل audit ندارند.
- ذخیره `fileUrl` به معنی پیاده‌سازی آپلود، بررسی مالکیت فایل یا دانلود محافظت‌شده نیست.
- pagination عمومی فهرست‌ها، seed مدیر اولیه و قالب یکپارچه خطاها در کدهای بررسی‌شده تکمیل نشده‌اند.
- اصلاح داده‌های تاریخی ناسازگار، جدا از اصلاح کد و migration ساختاری است.

## توسعه و نگهداری

تغییر Schema باید همراه migration و تولید Client باشد. تغییر قواعد کسب‌وکار باید در سرویس و تست مربوط منعکس شود. فیلد جدید API باید با DTO، Swagger و مصرف‌کننده فرانت‌اند هماهنگ شود. پیشنهادهای آینده را تا زمان پیاده‌سازی و آزمون، در بخش قابلیت‌های موجود ثبت نکنید.

## مجوز

مجوز استفاده و انتشار باید توسط مالک پروژه تعیین و در فایل `LICENSE` ثبت شود. این README مجوزی مانند MIT را به‌صورت پیش‌فرض به پروژه نسبت نمی‌دهد.
