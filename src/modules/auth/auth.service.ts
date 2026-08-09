import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
  Injectable,
} from '@nestjs/common';
import { roleType } from 'generated/prisma/enums';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { users } from 'generated/prisma/browser';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  async register(
    mobile: string,
    password: string,
    role: roleType = roleType.EMPLOYEE,
  ) {
    const alreadyExistMobile = await this.prisma.users.findUnique({
      where: { mobile },
    });

    if (alreadyExistMobile)
      throw new BadRequestException('شماره موبایل از قبل وجود دارد .');

    const passwordHashed = await bcrypt.hash(password, 12);

    const user = await this.prisma.users.create({
      data: { mobile, password: passwordHashed, role },
    });

    return user;
  }
  async validateUser(mobile: string, password: string) {
    const user = await this.prisma.users.findUnique({
      where: {
        mobile,
      },
    });
    if (!user)
      throw new NotFoundException('کاربری با این شماره موبایل یافت نشد');

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid)
      throw new UnauthorizedException('پسورد وارد شده صحیح نیست');

    return user;
  }

  async login(user: users) {
    const payload = { sub: user.id, role: user.role };

    //Access token
    const accessToken = this.jwtService.sign(
      { payload },
      {
        secret: this.config.get('JWT_ACCESS_SECRET'),
        expiresIn: this.config.get('ACCESS_TOKEN_EXPIRE'),
      },
    );

    //Refresh token
    const refreshToken = this.jwtService.sign(
      { sub: user.id },
      {
        secret: this.config.get('JWT_REFRESH_SECRET'),
        expiresIn: this.config.get('REFRESH_TOKEN_EXPIRE'),
      },
    );

    const tokenHash = await bcrypt.hash(refreshToken, 12);
    const rt = this.prisma.refresh_tokens.create({
      data: { tokenHash, userId: user.id },
    });

    return {
      accessToken,
      refreshToken,
      user,
    };
  }
}
