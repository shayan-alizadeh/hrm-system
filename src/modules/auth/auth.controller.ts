// src/modules/auth/auth.controller.ts
import {
  Body,
  Controller,
  Post,
  UnauthorizedException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { User } from '../../../generated/prisma/client.js';

import { AuthService } from './auth.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { RefreshTokenDto } from './dto/refresh-token.dto.js';
import { Public } from './decorators/public.decorator.js';
import { CurrentUser } from '../../common/decorators/user.decorator.js';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'ثبت‌نام کارمند/مدیر جدید' })
  async register(@Body() dto: RegisterDto) {
    const user = await this.authService.register(
      dto.mobile,
      dto.password,
      dto.firstName,
      dto.lastName,
      dto.role,
    );
    return { message: 'ثبت‌نام با موفقیت انجام شد', user };
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'ورود به سیستم و دریافت توکن' })
  async login(@Body() dto: LoginDto) {
    const user = await this.authService.validateUser(dto.mobile, dto.password);
    const result = await this.authService.login(user);
    return result;
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'دریافت اکسس توکن جدید با رفرش توکن' })
  async refresh(@Body() dto: RefreshTokenDto) {
    if (!dto.refreshToken) {
      throw new UnauthorizedException('Refresh token ارسال نشده است.');
    }
    const tokens = await this.authService.refreshToken(dto.refreshToken);
    return tokens;
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'خروج از سیستم (باطل کردن توکن‌ها)' })
  async logout(@CurrentUser() user: Pick<User, 'id'>) {
    // تایپ امن جایگزین any شد
    await this.authService.logout(user.id);
    return { message: 'با موفقیت از سیستم خارج شدید.' };
  }
}
