import { Transform } from 'class-transformer';
import {
  IsDefined,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { ContractType } from '../../../../generated/prisma/enums.js';
import { IsJalaliDate } from '../../../common/validators/is-jalali-date.validator.js';

/**
 * ورودی ثبت قرارداد.
 * مقادیر مالی باید به صورت عدد واقعی در بدنه JSON ارسال شوند.
 */
export class CreateContractDto {
  @ApiProperty({
    description: 'شناسه کارمند',
    example: 5,
    type: 'integer',
    minimum: 1,
    maximum: 2_147_483_647,
  })
  @IsDefined({ message: 'شناسه کارمند الزامی است.' })
  @IsInt({ message: 'شناسه کارمند باید عدد صحیح باشد.' })
  @Min(1, { message: 'شناسه کارمند باید بزرگ‌تر از صفر باشد.' })
  @Max(2_147_483_647, {
    message: 'شناسه کارمند خارج از محدوده مجاز است.',
  })
  userId!: number;

  @ApiProperty({
    description: 'شماره یکتای قرارداد',
    example: 'CNT-1404-0012',
    maxLength: 50,
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsDefined({ message: 'شماره قرارداد الزامی است.' })
  @IsString({ message: 'شماره قرارداد باید متن باشد.' })
  @IsNotEmpty({ message: 'شماره قرارداد نمی‌تواند خالی باشد.' })
  @MaxLength(50, {
    message: 'شماره قرارداد نمی‌‌تواند بیشتر از ۵۰ کاراکتر باشد.',
  })
  contractNo!: string;

  @ApiProperty({
    description: 'عنوان شغلی',
    example: 'Senior Backend Developer',
    maxLength: 100,
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsDefined({ message: 'عنوان شغلی الزامی است.' })
  @IsString({ message: 'عنوان شغلی باید متن باشد.' })
  @IsNotEmpty({ message: 'عنوان شغلی نمی‌تواند خالی باشد.' })
  @MaxLength(100, {
    message: 'عنوان شغلی نمی‌تواند بیشتر از ۱۰۰ کاراکتر باشد.',
  })
  jobTitle!: string;

  @ApiProperty({
    description: 'نوع قرارداد',
    enum: ContractType,
    enumName: 'ContractType',
    example: ContractType.FULL_TIME,
  })
  @IsDefined({ message: 'نوع قرارداد الزامی است.' })
  @IsEnum(ContractType, { message: 'نوع قرارداد نامعتبر است.' })
  type!: ContractType;

  @ApiProperty({
    description: 'تاریخ شمسی شروع قرارداد با قالب yyyy/mm/dd',
    example: '1404/01/01',
    type: String,
    minLength: 10,
    maxLength: 10,
  })
  @IsDefined({ message: 'تاریخ شروع الزامی است.' })
  @IsString({ message: 'تاریخ شروع باید رشته متنی باشد.' })
  @IsJalaliDate({ message: 'تاریخ شروع شمسی معتبر نیست.' })
  startDate!: string;

  @ApiProperty({
    description: 'تاریخ شمسی پایان قرارداد با قالب yyyy/mm/dd',
    example: '1404/12/29',
    type: String,
    minLength: 10,
    maxLength: 10,
  })
  @IsDefined({ message: 'تاریخ پایان الزامی است.' })
  @IsString({ message: 'تاریخ پایان باید رشته متنی باشد.' })
  @IsJalaliDate({ message: 'تاریخ پایان شمسی معتبر نیست.' })
  endDate!: string;

  @ApiProperty({
    description: 'حقوق پایه به ریال',
    example: 150_000_000,
    minimum: 0,
    maximum: Number.MAX_SAFE_INTEGER,
  })
  @IsDefined({ message: 'حقوق پایه الزامی است.' })
  // استفاده از IsInt برای جلوگیری از ورود مقادیر اعشاری (Float) در JSON
  @IsInt({ message: 'حقوق پایه باید عدد صحیح معتبر باشد.' })
  @Min(0, { message: 'حقوق پایه نمی‌تواند منفی باشد.' })
  @Max(Number.MAX_SAFE_INTEGER, {
    message: 'حقوق پایه خارج از محدوده مجاز است.',
  })
  baseSalary!: number;

  @ApiPropertyOptional({
    description: 'حق مسکن به ریال؛ در زمان ایجاد، مقدار پیش‌فرض صفر است.',
    example: 9_000_000,
    minimum: 0,
    maximum: Number.MAX_SAFE_INTEGER,
  })
  @ValidateIf((_object: unknown, value: unknown) => value !== undefined)
  @IsInt({ message: 'حق مسکن باید عدد صحیح معتبر باشد.' })
  @Min(0, { message: 'حق مسکن نمی‌تواند منفی باشد.' })
  @Max(Number.MAX_SAFE_INTEGER, {
    message: 'حق مسکن خارج از محدوده مجاز است.',
  })
  housingAllowance?: number;

  @ApiPropertyOptional({
    description: 'بن کارگری به ریال؛ در زمان ایجاد، مقدار پیش‌فرض صفر است.',
    example: 14_000_000,
    minimum: 0,
    maximum: Number.MAX_SAFE_INTEGER,
  })
  @ValidateIf((_object: unknown, value: unknown) => value !== undefined)
  @IsInt({ message: 'بن کارگری باید عدد صحیح معتبر باشد.' })
  @Min(0, { message: 'بن کارگری نمی‌تواند منفی باشد.' })
  @Max(Number.MAX_SAFE_INTEGER, {
    message: 'بن کارگری خارج از محدوده مجاز است.',
  })
  foodAllowance?: number;

  @ApiPropertyOptional({
    description: 'حق اولاد به ریال؛ در زمان ایجاد، مقدار پیش‌فرض صفر است.',
    example: 7_000_000,
    minimum: 0,
    maximum: Number.MAX_SAFE_INTEGER,
  })
  @ValidateIf((_object: unknown, value: unknown) => value !== undefined)
  @IsInt({ message: 'حق اولاد باید عدد صحیح معتبر باشد.' })
  @Min(0, { message: 'حق اولاد نمی‌تواند منفی باشد.' })
  @Max(Number.MAX_SAFE_INTEGER, {
    message: 'حق اولاد خارج از محدوده مجاز است.',
  })
  childAllowance?: number;

  @ApiPropertyOptional({
    description: 'شماره بیمه؛ ارسال null مجاز است.',
    example: '1234567890',
    type: String,
    nullable: true,
    maxLength: 20,
  })
  @IsOptional()
  @IsString({ message: 'شماره بیمه باید متن یا null باشد.' })
  @MaxLength(20, {
    message: 'شماره بیمه نمی‌تواند بیشتر از ۲۰ کاراکتر باشد.',
  })
  insuranceNo?: string | null;

  @ApiPropertyOptional({
    description: 'یادداشت قرارداد؛ ارسال null مجاز است.',
    type: String,
    nullable: true,
  })
  @IsOptional()
  @IsString({ message: 'یادداشت باید متن یا null باشد.' })
  notes?: string | null;
}
