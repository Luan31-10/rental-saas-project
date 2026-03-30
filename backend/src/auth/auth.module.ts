import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { MailModule } from 'src/mail/mail.module';

@Module({
  imports: [
    JwtModule.register({
      global: true, // Cho phép xài thẻ này ở mọi nơi trong dự án
      secret: process.env.JWT_SECRET || 'SUPER_SECRET_KEY_SAAS', // Chìa khóa bí mật để ký thẻ
      signOptions: { expiresIn: '1d' }, // Thẻ có hạn sử dụng 1 ngày
    }),
    MailModule,
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
