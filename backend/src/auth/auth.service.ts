import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { OAuth2Client } from 'google-auth-library';
import * as qrcode from 'qrcode';
import { MailService } from 'src/mail/mail.service';
import * as crypto from 'node:crypto';

export class ChangePasswordDto {
  oldPassword!: string;
  newPassword!: string;
}

// 🔥 Khai báo Interface chuẩn để NestJS biết chính xác Payload chứa gì, triệt tiêu 'any'
interface TempJwtPayload {
  email: string;
  isTemp: boolean;
  iat?: number;
  exp?: number;
}

@Injectable()
export class AuthService {
  private googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private mailService: MailService,
  ) {}

  async register(registerDto: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new BadRequestException('Email này đã được sử dụng!');
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(registerDto.password, saltRounds);

    const newUser = await this.prisma.user.create({
      data: {
        email: registerDto.email,
        password: hashedPassword,
        name: registerDto.name,
        role: registerDto.role || 'TENANT',
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...result } = newUser;
    const roleName = newUser.role === 'OWNER' ? 'Chủ trọ' : 'Khách thuê';

    return {
      message: `🎉 Đăng ký tài khoản ${roleName} thành công!`,
      user: result,
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: loginDto.email },
    });

    if (!user || !user.password) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng!');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng!');
    }

    if (user.isTwoFactorEnabled) {
      const tempPayload: TempJwtPayload = { email: user.email, isTemp: true };
      const tempToken = await this.jwtService.signAsync(tempPayload, {
        expiresIn: '5m',
      });

      return {
        message: 'Vui lòng xác thực 2 bước!',
        requires2FA: true,
        tempToken: tempToken,
      };
    }

    const payload = { id: user.id, email: user.email, role: user.role };
    const access_token = await this.jwtService.signAsync(payload);

    return {
      message: '🔓 Đăng nhập thành công!',
      requires2FA: false,
      access_token: access_token,
      user: { id: user.id, name: user.name, role: user.role },
    };
  }

  async verifyLogin2FA(tempToken: string, code: string) {
    try {
      // 🔥 Ép kiểu (Typecast) kết quả trả về thành TempJwtPayload để diệt 'any'
      const payload =
        await this.jwtService.verifyAsync<TempJwtPayload>(tempToken);
      if (!payload.isTemp) throw new BadRequestException('Token không hợp lệ!');

      const user = await this.prisma.user.findUnique({
        where: { email: payload.email },
      });
      if (!user || !user.twoFactorSecret)
        throw new BadRequestException('Lỗi tài khoản!');

      let isCodeValid = false;

      // Đã dọn dẹp các rule thừa (no-var-requires, no-unsafe-argument)
      /* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */
      const speakeasy = require('speakeasy');
      isCodeValid = Boolean(
        speakeasy.totp.verify({
          secret: user.twoFactorSecret,
          encoding: 'base32',
          token: code,
          window: 1,
        }),
      );
      /* eslint-enable @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */

      if (!isCodeValid) {
        throw new BadRequestException(
          'Mã xác thực 2FA không đúng hoặc đã hết hạn!',
        );
      }

      const finalPayload = { id: user.id, email: user.email, role: user.role };
      const access_token = await this.jwtService.signAsync(finalPayload);

      return {
        message: '🔓 Đăng nhập thành công!',
        access_token: access_token,
        user: { id: user.id, name: user.name, role: user.role },
      };
    } catch {
      // 🔥 Xóa chữ (error) để tránh lỗi 'error is defined but never used'
      throw new BadRequestException(
        'Phiên đăng nhập đã hết hạn hoặc mã không hợp lệ!',
      );
    }
  }

  async googleLogin(token: string) {
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();

      if (!payload || !payload.email) {
        throw new UnauthorizedException('Token Google không hợp lệ!');
      }

      const email = payload.email;
      const name = payload.name || email.split('@')[0];

      let user = await this.prisma.user.findUnique({ where: { email: email } });

      if (!user) {
        const tenant = await this.prisma.tenant.findFirst({
          where: { email: email, status: 'ACTIVE' },
        });

        const role = tenant ? 'TENANT' : 'OWNER';
        const randomPassword = Math.random().toString(36).slice(-10);
        const hashedPassword = await bcrypt.hash(randomPassword, 10);

        user = await this.prisma.user.create({
          data: { email, name, password: hashedPassword, role },
        });
      }

      const jwtPayload = { id: user.id, email: user.email, role: user.role };
      const access_token = await this.jwtService.signAsync(jwtPayload);

      return {
        message: '🔓 Đăng nhập Google thành công!',
        access_token: access_token,
        user: { id: user.id, name: user.name, role: user.role },
      };
    } catch (error) {
      console.error('Lỗi Google Login:', error);
      throw new UnauthorizedException('Đăng nhập bằng Google thất bại!');
    }
  }

  async changePassword(email: string, data: ChangePasswordDto) {
    const { oldPassword, newPassword } = data;

    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new BadRequestException('Tài khoản không tồn tại');
    }

    if (!user.password) {
      throw new BadRequestException(
        'Tài khoản Google không sử dụng mật khẩu. Vui lòng đổi mật khẩu bên tài khoản Google của bạn.',
      );
    }

    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordValid) {
      throw new BadRequestException('Mật khẩu hiện tại không chính xác!');
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { email },
      data: { password: hashedNewPassword },
    });

    return { message: 'Đổi mật khẩu thành công!' };
  }

  async generateTwoFactorAuthSecret(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new BadRequestException('Tài khoản không tồn tại');

    let finalOtpAuthUrl = '';
    let finalBase32Secret = '';

    // Đã dọn dẹp các rule thừa
    /* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */
    const speakeasy = require('speakeasy');
    const secret = speakeasy.generateSecret({ name: `LuanEZ (${email})` });
    finalOtpAuthUrl = String(secret.otpauth_url);
    finalBase32Secret = String(secret.base32);
    /* eslint-enable @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */

    if (!finalOtpAuthUrl || finalOtpAuthUrl === 'undefined') {
      throw new BadRequestException('Lỗi tạo URL QR Code');
    }

    await this.prisma.user.update({
      where: { email },
      data: { twoFactorSecret: finalBase32Secret },
    });

    const qrCodeImage = await qrcode.toDataURL(finalOtpAuthUrl);
    return { qrCodeImage, secret: finalBase32Secret };
  }

  async turnOnTwoFactorAuth(email: string, twoFactorCode: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user || !user.twoFactorSecret) {
      throw new BadRequestException('Chưa tạo mã bí mật 2FA!');
    }

    let isCodeValid = false;

    // Đã dọn dẹp các rule thừa
    /* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */
    const speakeasy = require('speakeasy');
    isCodeValid = Boolean(
      speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token: twoFactorCode,
        window: 1,
      }),
    );
    /* eslint-enable @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */

    if (!isCodeValid) {
      throw new BadRequestException(
        'Mã xác thực 2FA không hợp lệ hoặc đã hết hạn!',
      );
    }

    await this.prisma.user.update({
      where: { email },
      data: { isTwoFactorEnabled: true },
    });

    return { message: 'Đã BẬT bảo mật 2 lớp thành công!' };
  }

  async turnOffTwoFactorAuth(email: string) {
    await this.prisma.user.update({
      where: { email },
      data: {
        isTwoFactorEnabled: false,
        twoFactorSecret: null,
      },
    });
    return { message: 'Đã TẮT bảo mật 2 lớp thành công!' };
  }
  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Vì lý do bảo mật, không bao giờ báo "Email không tồn tại", cứ báo chung chung
      return { message: 'Nếu email hợp lệ, link đổi mật khẩu đã được gửi!' };
    }

    // Tạo token ngẫu nhiên 32 ký tự
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const resetToken = crypto.randomBytes(32).toString('hex');
    // Set thời gian hết hạn là 15 phút tính từ bây giờ
    const tokenExpires = new Date(Date.now() + 15 * 60 * 1000);

    // Lưu vào DB
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        resetToken: resetToken,
        resetTokenExpires: tokenExpires,
      },
    });
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    const resetLink = `${frontendUrl}/login?token=${resetToken}`;
    // Bắn Mail
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    await this.mailService.sendResetPasswordEmail(
      user.email,
      user.name || 'Chủ trọ',
      resetLink,
    );

    return { message: 'Nếu email hợp lệ, link đổi mật khẩu đã được gửi!' };
  }

  async resetPassword(token: string, newPassword: string) {
    // Tìm user có token này và token chưa bị hết hạn
    const user = await this.prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpires: { gt: new Date() }, // gt là "greater than" (lớn hơn hiện tại)
      },
    });

    if (!user) {
      throw new BadRequestException('Token không hợp lệ hoặc đã hết hạn!');
    }

    // Mã hóa mật khẩu mới
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Cập nhật pass mới và XÓA token đi (để không xài lại được nữa)
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpires: null,
      },
    });

    return { message: 'Đổi mật khẩu thành công! Sếp có thể đăng nhập.' };
  }
}
