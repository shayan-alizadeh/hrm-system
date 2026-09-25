import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { CreateContractDto } from '../dto/create-contract.dto.js';
import { UpdateContractDto } from '../dto/update-contract.dto.js';
import { ContractStatus } from '../../../../generated/prisma/client.js';

@Injectable()
export class ContractService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * ثبت قرارداد جدید برای یک کارمند
   */
  async createContract(dto: CreateContractDto) {
    // ۱. بررسی یکتا بودن شماره قرارداد در کل سیستم
    const existingContractNo = await this.prisma.contract.findUnique({
      where: { contractNo: dto.contractNo },
    });
    if (existingContractNo) {
      throw new ConflictException(
        `شماره قرارداد ${dto.contractNo} قبلاً در سیستم ثبت شده است.`,
      );
    }

    // ۲. بررسی وجود کارمند
    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
    });
    if (!user) {
      throw new NotFoundException('کارمند مورد نظر یافت نشد.');
    }

    // ۳. استفاده از تراکنش برای حفظ یکپارچگی داده‌ها
    return await this.prisma.$transaction(async (tx) => {
      // الف: ابتدا تمام قراردادهای "فعال" قبلیِ این کارمند را پیدا کرده و به حالت "پایان‌یافته" درمی‌آوریم
      await tx.contract.updateMany({
        where: {
          userId: dto.userId,
          status: ContractStatus.ACTIVE,
        },
        data: {
          status: ContractStatus.EXPIRED,
        },
      });

      // ب: حالا قرارداد جدید را به عنوان تنها قرارداد فعال ثبت می‌کنیم
      return await tx.contract.create({
        data: {
          userId: dto.userId,
          contractNo: dto.contractNo,
          jobTitle: dto.jobTitle,
          type: dto.type,
          startDate: dto.startDate,
          endDate: dto.endDate,
          baseSalary: dto.baseSalary,
          housingAllowance: dto.housingAllowance || 0,
          foodAllowance: dto.foodAllowance || 0,
          childAllowance: dto.childAllowance || 0,
          insuranceNo: dto.insuranceNo,
          notes: dto.notes,
          status: ContractStatus.ACTIVE, // به صورت پیش‌فرض فعال است
        },
      });
    });
  }

  /**
   * دریافت لیست تمام قراردادهای سازمان با قابلیت فیلتر
   */
  async getAllContracts(userId?: number, status?: ContractStatus) {
    return await this.prisma.contract.findMany({
      where: {
        ...(userId && { userId }),
        ...(status && { status }),
      },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * دریافت تنها قرارداد "فعال" یک کارمند (برای استفاده در فیش حقوقی)
   */
  async getActiveContractByUserId(userId: number) {
    const activeContract = await this.prisma.contract.findFirst({
      where: {
        userId,
        status: ContractStatus.ACTIVE,
      },
    });

    if (!activeContract) {
      throw new NotFoundException(
        'این کارمند در حال حاضر هیچ قرارداد فعالی ندارد.',
      );
    }

    return activeContract;
  }

  /**
   * دریافت جزئیات یک قرارداد خاص از طریق ID
   */
  async getContractById(id: number) {
    const contract = await this.prisma.contract.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    if (!contract) {
      throw new NotFoundException('قرارداد یافت نشد.');
    }

    return contract;
  }

  /**
   * ویرایش اطلاعات قرارداد
   * نکته حقوقی: ویرایش فیلدهای مالی در قرارداد فعال توصیه نمی‌شود،
   * اما برای رفع اشتباهات تایپیِ ادمین این امکان باز گذاشته شده است.
   */
  async updateContract(id: number, dto: UpdateContractDto) {
    const contract = await this.prisma.contract.findUnique({ where: { id } });
    if (!contract) {
      throw new NotFoundException('قرارداد یافت نشد.');
    }

    // اگر شماره قرارداد در حال تغییر است، چک کنیم تکراری نباشد
    if (dto.contractNo && dto.contractNo !== contract.contractNo) {
      const duplicate = await this.prisma.contract.findUnique({
        where: { contractNo: dto.contractNo },
      });
      if (duplicate) {
        throw new ConflictException('شماره قرارداد جدید قبلاً ثبت شده است.');
      }
    }

    // اگر می‌خواهیم وضعیت این قرارداد را دستی "فعال" کنیم، باید بقیه قراردادهای این کارمند را منقضی کنیم
    if (
      dto.status === ContractStatus.ACTIVE &&
      contract.status !== ContractStatus.ACTIVE
    ) {
      await this.prisma.contract.updateMany({
        where: {
          userId: contract.userId,
          status: ContractStatus.ACTIVE,
          id: { not: id },
        },
        data: { status: ContractStatus.EXPIRED },
      });
    }

    return await this.prisma.contract.update({
      where: { id },
      data: dto,
    });
  }
}
