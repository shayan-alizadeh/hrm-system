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
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { Roles } from '../../../modules/auth/decorators/roles.decorator.js';
import { RoleType } from '../../../../generated/prisma/enums.js';

import { CurrentUser } from '../../../common/decorators/user.decorator.js';

import { LeaveEmployeeService } from '../services/leave-employee.service.js';
import { CreateLeaveRequestDto } from '../dto/create-leave-request.dto.js';
import { FilterLeaveDto } from '../dto/filter-leave.dto.js';

@ApiTags('Leaves - Employee')
@ApiBearerAuth()
@Roles(RoleType.EMPLOYEE)
@Controller('employee/leaves')
export class LeaveEmployeeController {
  constructor(private readonly leavesService: LeaveEmployeeService) {}

  @Get('balance')
  @ApiOperation({ summary: 'مشاهده مانده مرخصی استحقاقی امسال من' })
  async getMyBalance(@CurrentUser() user: { id: number }) {
    return await this.leavesService.getMyBalance(user.id);
  }

  @Post('request')
  @ApiOperation({ summary: 'ثبت درخواست مرخصی جدید' })
  async createRequest(
    @Body() dto: CreateLeaveRequestDto,
    @CurrentUser() user: { id: number },
  ) {
    return await this.leavesService.createRequest(user.id, dto);
  }

  @Get('requests')
  @ApiOperation({ summary: 'مشاهده لیست درخواست‌های مرخصی من' })
  async getMyRequests(
    @Query() filters: FilterLeaveDto,
    @CurrentUser() user: { id: number },
  ) {
    return await this.leavesService.getMyRequests(user.id, filters);
  }

  @Patch('request/:id/cancel')
  @ApiOperation({ summary: 'لغو درخواست مرخصی (فقط در حالت PENDING)' })
  async cancelRequest(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: { id: number },
  ) {
    return await this.leavesService.cancelRequest(id, user.id);
  }
}
