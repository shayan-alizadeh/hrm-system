import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { DepartmentManagerService } from '../services/department-manager.service.js';
import { CreateDepartmentDto } from '../dto/create-department.dto.js';
import { UpdateDepartmentDto } from '../dto/update-department.dto.js';
// import { Department } from '../entities/department.entity';
import { ApiBearerAuth } from '@nestjs/swagger';
import { RoleType } from '../../../../generated/prisma/enums.js';
import { Roles } from '../../auth/decorators/roles.decorator.js';

/**
 * کنترلر ادمین برای مدیریت دپارتمان‌ها
 * مسیرهای CRUD را ارائه می‌دهد
 */
// api.hrsystem.ir/manager
@ApiBearerAuth()
@Roles(RoleType.MANAGER)
@Controller('manager/departments')
export class DepartmentManagerController {
  constructor(private readonly departmentsService: DepartmentManagerService) {}

  /** POST /admin/departments */
  @Post()
  async create(@Body() dto: CreateDepartmentDto) {
    return await this.departmentsService.create(dto);
  }

  /** GET /admin/departments */
  @Get()
  async findAll() {
    return await this.departmentsService.findAll();
  }

  /** GET /admin/departments/:id */
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.departmentsService.findOne(id);
  }

  /** PATCH /admin/departments/:id */
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateDepartmentDto,
  ) {
    return await this.departmentsService.update(id, dto);
  }

  /** DELETE /admin/departments/:id */
  @Delete(':id')
  async remove(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ success: boolean }> {
    await this.departmentsService.remove(id);
    return { success: true };
  }
}
