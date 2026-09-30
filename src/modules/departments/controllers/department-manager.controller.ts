import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';

import { RoleType } from '../../../../generated/prisma/enums.js';
import { ParseIdPipe } from '../../../common/pipes/parse-id.pipe.js';
import { Roles } from '../../auth/decorators/roles.decorator.js';
import { CreateDepartmentDto } from '../dto/create-department.dto.js';
import { UpdateDepartmentDto } from '../dto/update-department.dto.js';
import { DepartmentManagerService } from '../services/department-manager.service.js';

/**
 * مسیرهای مدیریت دپارتمان برای مدیران.
 * اعتبارسنجی body توسط ValidationPipe سراسری انجام می‌شود.
 */
@ApiBearerAuth()
@Roles(RoleType.MANAGER)
@Controller('manager/departments')
export class DepartmentManagerController {
  constructor(private readonly departmentService: DepartmentManagerService) {}

  /** POST /api/v1/manager/departments */
  @Post()
  async create(@Body() dto: CreateDepartmentDto) {
    return this.departmentService.create(dto);
  }

  /** GET /api/v1/manager/departments */
  @Get()
  async findAll() {
    return this.departmentService.findAll();
  }

  /** GET /api/v1/manager/departments/:id */
  @Get(':id')
  async findOne(@Param('id', ParseIdPipe) id: number) {
    return this.departmentService.findOne(id);
  }

  /** PATCH /api/v1/manager/departments/:id */
  @Patch(':id')
  async update(
    @Param('id', ParseIdPipe) id: number,
    @Body() dto: UpdateDepartmentDto,
  ) {
    return this.departmentService.update(id, dto);
  }

  /** DELETE /api/v1/manager/departments/:id */
  @Delete(':id')
  async remove(
    @Param('id', ParseIdPipe) id: number,
  ): Promise<{ success: boolean }> {
    await this.departmentService.remove(id);

    return { success: true };
  }
}
