import { Body, Controller, Post, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { RefreshTokenDto } from './dto/refresh-token.dto.js';
// import { Public } from './decorators/public.decorator';
// import { ApiTags } from '@nestjs/swagger';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    const user = await this.authService.register(
      dto.mobile,
      dto.password,
      dto.role,
    );
    return user;
  }

  @Post('login')
  async login(@Body() dto: LoginDto) {
    const user = await this.authService.validateUser(dto.mobile, dto.password);

    const tokens = await this.authService.login(user);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  @Post('refresh')
  async refresh(@Body() dto: RefreshTokenDto) {
    if (!dto.refreshToken)
      throw new UnauthorizedException('Refresh token missing!');

    const tokens = await this.authService.refreshToken(dto.refreshToken);

    return {
      accessToken: tokens?.newAccessToken,
      refreshToken: tokens?.newRefreshToken,
    };
  }
}
