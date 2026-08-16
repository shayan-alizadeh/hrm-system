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
import { DepartmentsManagerService } from '../services/departments-manager.service';
import { CreateDepartmentDto } from '../dto/create-department.dto';
import { UpdateDepartmentDto } from '../dto/update-department.dto';
// import { Department } from '../entities/department.entity';
import { ApiBearerAuth } from '@nestjs/swagger';
import { roleType } from 'generated/prisma/enums';
import { Roles } from '../../../modules/auth/decorators/roles.decorator';

/**
 * کنترلر ادمین برای مدیریت دپارتمان‌ها
 * مسیرهای CRUD را ارائه می‌دهد
 */
@ApiBearerAuth()
@Roles(roleType.MANAGER)
// api.hrsystem.ir/manager
@Controller('manager/departments')
export class DepartmentsManagerController {
  constructor(private readonly departmentsService: DepartmentsManagerService) {}

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
  ){
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
