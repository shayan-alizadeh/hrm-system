import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import jalaali from 'jalaali-js';
import { Prisma } from '../../../../generated/prisma/client.js';
import {
  ContractStatus,
  ContractType,
} from '../../../../generated/prisma/enums.js';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { CreateContractDto } from '../dto/create-contract.dto.js';
import { UpdateContractDto } from '../dto/update-contract.dto.js';

// تغییر تایپ‌ها برای پشتیبانی هم‌‌زمان از number ورودی کاربر و Decimal دیتابیس
type ContractValues = {
  userId: number;
  contractNo: string;
  jobTitle: string;
  type: ContractType;
  status: ContractStatus;
  startDate: string;
  endDate: string;
  baseSalary: number | Prisma.Decimal;
  housingAllowance: number | Prisma.Decimal;
  foodAllowance: number | Prisma.Decimal;
  childAllowance: number | Prisma.Decimal;
  insuranceNo: string | null;
  notes: string | null;
  fileUrl: string | null;
};

const { isValidJalaaliDate } = jalaali;

@Injectable()
export class ContractService {
  constructor(private readonly prisma: PrismaService) {}

  private assertId(id: number): void {
    if (!Number.isInteger(id) || id < 1 || id > 2_147_483_647) {
      throw new BadRequestException('شناسه خارج از محدوده مجاز است.');
    }
  }

  private assertText(value: unknown, label: string, maxLength: number): void {
    if (typeof value !== 'string' || value.trim().length === 0) {
      throw new BadRequestException(`${label} الزامی است.`);
    }

    if (Array.from(value).length > maxLength) {
      throw new BadRequestException(
        `${label} نمی‌تواند بیشتر از ${maxLength} کاراکتر باشد.`,
      );
    }
  }

  private assertNullableText(
    value: unknown,
    label: string,
    maxLength?: number,
  ): void {
    if (value === null) {
      return;
    }

    if (typeof value !== 'string') {
      throw new BadRequestException(`${label} باید متن یا null باشد.`);
    }

    if (maxLength !== undefined && Array.from(value).length > maxLength) {
      throw new BadRequestException(
        `${label} نمی‌تواند بیشتر از ${maxLength} کاراکتر باشد.`,
      );
    }
  }

  private assertDate(value: unknown, label: string): void {
    if (typeof value !== 'string') {
      throw new BadRequestException(`${label} باید رشته متنی باشد.`);
    }

    const match = /^(1[34]\d{2})\/(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])$/.exec(
      value,
    );

    if (
      !match ||
      !isValidJalaaliDate(Number(match[1]), Number(match[2]), Number(match[3]))
    ) {
      throw new BadRequestException(
        `${label} باید تاریخ شمسی معتبر با قالب yyyy/mm/dd باشد.`,
      );
    }
  }

  /**
   * اعتبارسنجی وضعیت نهایی قرارداد، به‌ویژه برای PATCH جزئی.
   */
  private validateContract(values: ContractValues): void {
    this.assertId(values.userId);
    this.assertText(values.contractNo, 'شماره قرارداد', 50);
    this.assertText(values.jobTitle, 'عنوان شغلی', 100);

    if (!Object.values(ContractType).includes(values.type)) {
      throw new BadRequestException('نوع قرارداد نامعتبر است.');
    }

    if (!Object.values(ContractStatus).includes(values.status)) {
      throw new BadRequestException('وضعیت قرارداد نامعتبر است.');
    }

    this.assertDate(values.startDate, 'تاریخ شروع');
    this.assertDate(values.endDate, 'تاریخ پایان');

    if (values.startDate > values.endDate) {
      throw new BadRequestException(
        'تاریخ پایان قرارداد نمی‌تواند قبل از تاریخ شروع باشد.',
      );
    }

    const amounts: Array<[string, number | Prisma.Decimal]> = [
      ['حقوق پایه', values.baseSalary],
      ['حق مسکن', values.housingAllowance],
      ['بن کارگری', values.foodAllowance],
      ['حق اولاد', values.childAllowance],
    ];

    for (const [label, val] of amounts) {
      // پشتیبانی از Decimal در زمان Update
      const amount = val instanceof Prisma.Decimal ? val.toNumber() : val;

      if (
        typeof amount !== 'number' ||
        !Number.isFinite(amount) ||
        amount < 0 ||
        amount > Number.MAX_SAFE_INTEGER
      ) {
        throw new BadRequestException(
          `${label} باید عدد نامنفی در محدوده مجاز باشد.`,
        );
      }
    }

    this.assertNullableText(values.insuranceNo, 'شماره بیمه', 20);
    this.assertNullableText(values.notes, 'یادداشت');
    this.assertNullableText(values.fileUrl, 'مسیر فایل', 191);
  }

  /**
   * تنها تعارض تراکنشی تکرار می‌شود.
   * callback نباید شامل اثر جانبی خارج از دیتابیس باشد.
   */
  private async runTransaction<T>(
    operation: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    const maxAttempts = 3;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        return await this.prisma.$transaction(operation, {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        });
      } catch (error: unknown) {
        if (!(error instanceof Prisma.PrismaClientKnownRequestError)) {
          throw error;
        }

        if (error.code === 'P2034') {
          if (attempt < maxAttempts) {
            continue;
          }
          throw new ConflictException(
            'قراردادها هم‌زمان تغییر کرده‌اند. لطفاً دوباره تلاش کنید.',
          );
        }
        if (error.code === 'P2002') {
          throw new ConflictException(
            'شماره قرارداد قبلاً در سیستم ثبت شده است.',
          );
        }
        if (error.code === 'P2025') {
          throw new NotFoundException('قرارداد یافت نشد.');
        }
        if (error.code === 'P2003') {
          throw new ConflictException(
            'ثبت قرارداد به دلیل تغییر یا نبود اطلاعات کارمند ممکن نیست.',
          );
        }

        throw error;
      }
    }
    throw new ConflictException('عملیات قرارداد تکمیل نشد.');
  }

  /**
   * مطابق سیاست فعلی، قرارداد جدید بلافاصله ACTIVE می‌شود.
   * شکست ثبت، تغییر وضعیت قراردادهای قبلی را نیز rollback می‌کند.
   */
  async createContract(dto: CreateContractDto) {
    const data: ContractValues = {
      userId: dto.userId,
      contractNo: dto.contractNo,
      jobTitle: dto.jobTitle,
      type: dto.type,
      startDate: dto.startDate,
      endDate: dto.endDate,
      baseSalary: dto.baseSalary,
      housingAllowance: dto.housingAllowance ?? 0,
      foodAllowance: dto.foodAllowance ?? 0,
      childAllowance: dto.childAllowance ?? 0,
      insuranceNo: dto.insuranceNo ?? null,
      notes: dto.notes ?? null,
      fileUrl: null,
      status: ContractStatus.ACTIVE,
    };

    this.validateContract(data);

    return this.runTransaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: data.userId },
        select: { id: true },
      });

      if (!user) {
        throw new NotFoundException('کارمند مورد نظر یافت نشد.');
      }

      await tx.contract.updateMany({
        where: {
          userId: data.userId,
          status: ContractStatus.ACTIVE,
        },
        data: {
          status: ContractStatus.EXPIRED,
        },
      });

      return tx.contract.create({ data });
    });
  }

  async getAllContracts(userId?: number, status?: ContractStatus) {
    if (userId !== undefined) {
      this.assertId(userId);
    }

    if (
      status !== undefined &&
      !Object.values(ContractStatus).includes(status)
    ) {
      throw new BadRequestException('وضعیت قرارداد نامعتبر است.');
    }

    return this.prisma.contract.findMany({
      where: {
        ...(userId !== undefined && { userId }),
        ...(status !== undefined && { status }),
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });
  }

  /**
   * ACTIVE به وضعیت ثبت‌شده اشاره دارد.
   * بررسی پوشش بازه فیش بر عهده سرویس Payroll است.
   */
  async getActiveContractByUserId(userId: number) {
    this.assertId(userId);

    const contracts = await this.prisma.contract.findMany({
      where: {
        userId,
        status: ContractStatus.ACTIVE,
      },
      take: 2, // تکنیک عالی برای شناسایی سریع Data Inconsistency
      orderBy: { id: 'asc' },
    });

    if (contracts.length === 0) {
      throw new NotFoundException('این کارمند قرارداد دارای وضعیت فعال ندارد.');
    }

    if (contracts.length > 1) {
      throw new ConflictException(
        'بیش از یک قرارداد فعال برای این کارمند ثبت شده است؛ وضعیت قراردادها باید اصلاح شود.',
      );
    }

    return contracts[0];
  }

  async getContractById(id: number) {
    this.assertId(id);

    const contract = await this.prisma.contract.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!contract) {
      throw new NotFoundException('قرارداد یافت نشد.');
    }

    return contract;
  }

  /**
   * فقط فیلدهای مجاز به دیتابیس منتقل می‌شوند.
   * undefined یعنی عدم تغییر؛ null برای فیلد nullable یعنی پاک کردن مقدار.
   */
  async updateContract(id: number, dto: UpdateContractDto) {
    this.assertId(id);

    return this.runTransaction(async (tx) => {
      const existing = await tx.contract.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new NotFoundException('قرارداد یافت نشد.');
      }

      // استفاده از Spread و Fallback برای تمیزتر شدن کد نسبت به نوشتن شرط‌های سه‌گانه تو در تو
      const data: ContractValues = {
        ...existing,
        ...dto,
        // مقادیری که undefined ارسال می‌شوند، با مقادیر قبلی جایگزین می‌شوند
        userId: dto.userId ?? existing.userId,
        contractNo: dto.contractNo ?? existing.contractNo,
        jobTitle: dto.jobTitle ?? existing.jobTitle,
        type: dto.type ?? existing.type,
        status: dto.status ?? existing.status,
        startDate: dto.startDate ?? existing.startDate,
        endDate: dto.endDate ?? existing.endDate,
        baseSalary: dto.baseSalary ?? existing.baseSalary,
        housingAllowance: dto.housingAllowance ?? existing.housingAllowance,
        foodAllowance: dto.foodAllowance ?? existing.foodAllowance,
        childAllowance: dto.childAllowance ?? existing.childAllowance,
        // در مورد null پذیرها اگر دقیقاً null فرستاده شد اعمال شود، وگرنه مقدار قبلی
        insuranceNo:
          dto.insuranceNo === undefined
            ? existing.insuranceNo
            : dto.insuranceNo,
        notes: dto.notes === undefined ? existing.notes : dto.notes,
        fileUrl: dto.fileUrl === undefined ? existing.fileUrl : dto.fileUrl,
      };

      this.validateContract(data);

      const user = await tx.user.findUnique({
        where: { id: data.userId },
        select: { id: true },
      });

      if (!user) {
        throw new NotFoundException('کارمند مورد نظر یافت نشد.');
      }

      if (data.status === ContractStatus.ACTIVE) {
        // پس از تغییر userId، قراردادهای کارمند مقصد باید بررسی شوند.
        await tx.contract.updateMany({
          where: {
            userId: data.userId,
            status: ContractStatus.ACTIVE,
            id: { not: id },
          },
          data: {
            status: ContractStatus.EXPIRED,
          },
        });
      }

      return tx.contract.update({
        where: { id },
        data,
      });
    });
  }
}
