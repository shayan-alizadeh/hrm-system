import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';

import { validateEnvironment } from './config/env.validation.js';
import { TransformResponseInterceptor } from './common/interceptors/transform-response.interceptor.js';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard.js';
import { RolesGuard } from './modules/auth/guards/roles.guard.js';

import { PrismaModule } from './prisma/prisma.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { DepartmentModule } from './modules/departments/department.module.js';
import { AttendanceModule } from './modules/attendances/attendance.module.js';
import { LeaveModule } from './modules/leaves/leave.module.js';
import { PayrollModule } from './modules/payrolls/payroll.module.js';
import { ContractModule } from './modules/contracts/contract.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validate: validateEnvironment,
    }),
    PrismaModule,
    AuthModule,
    DepartmentModule,
    AttendanceModule,
    PayrollModule,
    LeaveModule,
    ContractModule,
  ],
  controllers: [],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_INTERCEPTOR, useClass: TransformResponseInterceptor },
  ],
})
export class AppModule {}
