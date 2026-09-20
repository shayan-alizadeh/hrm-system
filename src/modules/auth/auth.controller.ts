import {
  Body,
  Controller,
  Post,
  UnauthorizedException,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { RegisterDto } from './dto/register.dto.js'; // یادت نره firstName و lastName رو به این DTO اضافه کنی
import { LoginDto } from './dto/login.dto.js';
import { RefreshTokenDto } from './dto/refresh-token.dto.js';
import { Public } from './decorators/public.decorator.js';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CurrentUser } from 'src/common/decorators/user.decorator.js';

@ApiTags('Auth')
@Controller('auth') // دکوراتور @Public از اینجا برداشته شد
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public() // فقط این روت پابلیک است
  @Post('register')
  @ApiOperation({ summary: 'ثبت‌نام کارمند/مدیر جدید' })
  async register(@Body() dto: RegisterDto) {
    // فیلدهای جدید اضافه شدند
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
  @HttpCode(HttpStatus.OK) // لاگین بهتره 200 برگردونه تا 201
  @ApiOperation({ summary: 'ورود به سیستم و دریافت توکن' })
  async login(@Body() dto: LoginDto) {
    const user = await this.authService.validateUser(dto.mobile, dto.password);
    const result = await this.authService.login(user);

    return {
      user: result.user, // فرستادن اطلاعات کاربر برای فرانت‌اند
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    };
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'دریافت اکسس توکن جدید با رفرش توکن' })
  async refresh(@Body() dto: RefreshTokenDto) {
    if (!dto.refreshToken)
      throw new UnauthorizedException('Refresh token ارسال نشده است.');

    const tokens = await this.authService.refreshToken(dto.refreshToken);

    return {
      accessToken: tokens.newAccessToken,
      refreshToken: tokens.newRefreshToken,
    };
  }

  // این روت پابلیک نیست! پس از JwtAuthGuard عبور می‌کند و req.user ست می‌شود
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth() // اضافه شدن قفل به Swagger
  @ApiOperation({ summary: 'خروج از سیستم (باطل کردن توکن‌ها)' })
  async logout(@CurrentUser() user:any) {
    // گرفتن id کاربر از توکن (که توسط JwtStrategy استخراج شده)

    await this.authService.logout(user.id);
    return { message: 'با موفقیت از سیستم خارج شدید.' };
  }
}
