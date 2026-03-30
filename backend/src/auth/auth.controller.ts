import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Request,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { AuthService, ChangePasswordDto } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthGuard } from './auth.guard';
import { Request as ExpressRequest } from 'express';

// Interface chuẩn cho Request để ESLint không soi "any"
interface RequestWithUser extends ExpressRequest {
  user: {
    id: string;
    email: string;
    role: string;
  };
}

// DTO cho việc gửi mã xác nhận 2FA
export class TurnOn2FaDto {
  code!: string;
}

// 🔥 DTO MỚI: Dùng cho lúc xác thực 2FA khi Đăng nhập
export class VerifyLogin2FaDto {
  tempToken!: string;
  code!: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  // 🔥 MỞ CỔNG API XÁC THỰC 2FA LÚC ĐĂNG NHẬP
  @Post('login/verify-2fa')
  @HttpCode(HttpStatus.OK)
  verifyLogin2FA(@Body() body: VerifyLogin2FaDto) {
    return this.authService.verifyLogin2FA(body.tempToken, body.code);
  }

  @Post('google')
  googleLogin(@Body('token') token: string) {
    return this.authService.googleLogin(token);
  }

  @UseGuards(AuthGuard)
  @Get('profile')
  getProfile(@Request() req: RequestWithUser) {
    return {
      message: 'Xin chào!',
      userInfo: req.user,
    };
  }

  @UseGuards(AuthGuard)
  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @Request() req: RequestWithUser,
    @Body() body: ChangePasswordDto,
  ) {
    return this.authService.changePassword(req.user.email, body);
  }

  // ==========================================
  // 🔥 MỞ CỔNG API CHO TÍNH NĂNG SETUP 2FA
  // ==========================================

  @UseGuards(AuthGuard)
  @Get('2fa/generate')
  async generate2Fa(@Request() req: RequestWithUser) {
    return this.authService.generateTwoFactorAuthSecret(req.user.email);
  }

  @UseGuards(AuthGuard)
  @Post('2fa/turn-on')
  @HttpCode(HttpStatus.OK)
  async turnOn2Fa(@Request() req: RequestWithUser, @Body() body: TurnOn2FaDto) {
    return this.authService.turnOnTwoFactorAuth(req.user.email, body.code);
  }

  @UseGuards(AuthGuard)
  @Post('2fa/turn-off')
  @HttpCode(HttpStatus.OK)
  async turnOff2Fa(@Request() req: RequestWithUser) {
    return this.authService.turnOffTwoFactorAuth(req.user.email);
  }

  @Post('forgot-password')
  async forgotPassword(@Body() body: { email: string }) {
    return this.authService.forgotPassword(body.email);
  }

  @Post('reset-password')
  async resetPassword(@Body() body: { token: string; newPassword: string }) {
    return this.authService.resetPassword(body.token, body.newPassword);
  }
}
