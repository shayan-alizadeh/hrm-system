import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';
import { Roles } from '../../auth/decorators/roles.decorator.js';
import {
  ContractStatus,
  RoleType,
} from '../../../../generated/prisma/client.js';

import { ContractService } from '../services/contract.service.js';
import { CreateContractDto } from '../dto/create-contract.dto.js';
import { UpdateContractDto } from '../dto/update-contract.dto.js';

@ApiTags('Contracts - Manager')
@ApiBearerAuth()
@Roles(RoleType.MANAGER)
@Controller('manager/contracts')
export class ContractsManagerController {
  constructor(private readonly contractsService: ContractService) {}

  @Post()
  @ApiOperation({
    summary: 'ثبت قرارداد جدید برای کارمند (لغو خودکار قرارداد قبلی)',
  })
  async create(@Body() dto: CreateContractDto) {
    return await this.contractsService.createContract(dto);
  }

  @Get()
  @ApiOperation({ summary: 'دریافت لیست تمام قراردادهای سازمان' })
  @ApiQuery({
    name: 'userId',
    required: false,
    type: Number,
    description: 'فیلتر بر اساس شناسه کارمند',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ContractStatus,
    description: 'فیلتر بر اساس وضعیت قرارداد',
  })
  async findAll(
    @Query('userId') userId?: string,
    @Query('status') status?: ContractStatus,
  ) {
    // تبدیل userId از استرینگ به عدد (چون دیتای Query پارامتر همیشه استرینگ است)
    const parsedUserId = userId ? parseInt(userId, 10) : undefined;
    return await this.contractsService.getAllContracts(parsedUserId, status);
  }

  @Get('active/:userId')
  @ApiOperation({ summary: 'دریافت قرارداد فعال یک کارمند خاص' })
  async findActiveByUserId(@Param('userId', ParseIntPipe) userId: number) {
    return await this.contractsService.getActiveContractByUserId(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'دریافت جزئیات یک قرارداد خاص از طریق شناسه (ID)' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.contractsService.getContractById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'ویرایش اطلاعات یک قرارداد' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateContractDto,
  ) {
    return await this.contractsService.updateContract(id, dto);
  }
}
