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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { RoleType } from '../../../../generated/prisma/enums.js';
import { Roles } from '../../auth/decorators/roles.decorator.js';
import { CreateContractDto } from '../dto/create-contract.dto.js';
import { FilterContractDto } from '../dto/filter-contracts.dto.js';
import { UpdateContractDto } from '../dto/update-contract.dto.js';
import { ContractService } from '../services/contract.service.js';

@ApiTags('Contracts - Manager')
@ApiBearerAuth()
@Roles(RoleType.MANAGER)
@Controller('manager/contracts')
export class ContractManagerController {
  constructor(private readonly contractsService: ContractService) {}

  @Post()
  @ApiOperation({
    summary: 'ثبت قرارداد فعال جدید و پایان دادن به وضعیت فعال قرارداد قبلی',
  })
  async create(@Body() dto: CreateContractDto) {
    return this.contractsService.createContract(dto);
  }

  @Get()
  @ApiOperation({
    summary: 'دریافت قراردادهای سازمان با فیلتر کارمند و وضعیت',
  })
  async findAll(@Query() filters: FilterContractDto) {
    return this.contractsService.getAllContracts(
      filters.userId,
      filters.status,
    );
  }

  @Get('active/:userId')
  @ApiOperation({
    summary: 'دریافت قرارداد دارای وضعیت فعال یک کارمند',
  })
  async findActiveByUserId(@Param('userId', ParseIntPipe) userId: number) {
    return this.contractsService.getActiveContractByUserId(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'دریافت جزئیات قرارداد' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.contractsService.getContractById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'ویرایش اطلاعات قرارداد' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateContractDto,
  ) {
    return this.contractsService.updateContract(id, dto);
  }
}
