import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import type { User } from '../../../generated/prisma/client.js';
import { CurrentUser } from '../../common/decorators/user.decorator.js';
import { AuthService } from './auth.service.js';
import { Public } from './decorators/public.decorator.js';
import { LoginDto } from './dto/login.dto.js';
import { RefreshTokenDto } from './dto/refresh-token.dto.js';
import { RegisterDto } from './dto/register.dto.js';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'ثبت‌نام کارمند جدید' })
  async register(@Body() dto: RegisterDto) {
    // محدودیت نقش در خود سرویس نیز اعمال می‌شود تا قابل دورزدن نباشد.
    const user = await this.authService.register(
      dto.mobile,
      dto.password,
      dto.firstName,
      dto.lastName,
      dto.role,
    );

    return {
      message: 'ثبت‌نام با موفقیت انجام شد',
      user,
    };
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'ورود به سیستم و دریافت توکن' })
  async login(@Body() dto: LoginDto) {
    const user = await this.authService.validateUser(dto.mobile, dto.password);

    return this.authService.login(user);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'تعویض رفرش توکن و دریافت اکسس توکن جدید' })
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto.refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'خروج از همه نشست‌های کاربر' })
  async logout(@CurrentUser() user: Pick<User, 'id'>) {
    await this.authService.logout(user.id);

    return {
      message: 'با موفقیت از سیستم خارج شدید.',
    };
  }
}
