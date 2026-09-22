import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DepartmentModule } from './modules/departments/department.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard.js';
import { RolesGuard } from './modules/auth/guards/roles.guard.js';
import { AttendanceModule } from './modules/attendances/attendance.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    DepartmentModule,
    AuthModule,
    AttendanceModule,
  ],
  controllers: [],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
