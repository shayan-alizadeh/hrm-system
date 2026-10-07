import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { Roles } from '../../auth/decorators/roles.decorator.js';
import { RoleType } from '../../../../generated/prisma/enums.js';

import { LeaveManagerService } from '../services/leave-manager.service.js';
import { ResolveLeaveRequestDto } from '../dto/resolve-leave-request.dto.js';
import { FilterLeaveDto } from '../dto/filter-leave.dto.js';

@ApiTags('Leaves - Manager')
@ApiBearerAuth()
@Roles(RoleType.MANAGER)
@Controller('manager/leaves')
export class LeaveManagerController {
  constructor(private readonly leavesService: LeaveManagerService) {}

  @Get('requests')
  @ApiOperation({ summary: 'مشاهده لیست تمام درخواست‌های مرخصی سازمان' })
  async getAllRequests(@Query() filters: FilterLeaveDto) {
    return await this.leavesService.getAllRequests(filters);
  }

  @Get('request/:id')
  @ApiOperation({ summary: 'مشاهده جزئیات یک درخواست مرخصی مشخص' })
  async getRequestById(@Param('id', ParseIntPipe) id: number) {
    return await this.leavesService.getRequestById(id);
  }

  @Patch('request/:id/resolve')
  @ApiOperation({ summary: 'تایید یا رد درخواست مرخصی توسط مدیر' })
  async resolveRequest(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ResolveLeaveRequestDto,
  ) {
    return await this.leavesService.resolveRequest(id, dto);
  }

  @Get('balances')
  @ApiOperation({ summary: 'مشاهده مانده مرخصی تمام کارمندان' })
  async getAllBalances() {
    // در یک پروژه واقعی‌تر، این روت هم می‌تواند قابلیت فیلتر شدن با userId داشته باشد
    return await this.leavesService.getAllBalances();
  }
}
