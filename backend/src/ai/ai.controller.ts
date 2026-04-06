import {
  Controller,
  Post,
  Body,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AiService } from './ai.service';
import { Request } from 'express';

// 🔥 Gọi đúng Bảo vệ của nhà sếp
import { AuthGuard } from '../auth/auth.guard';

interface RequestWithUser extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    sub?: string;
  };
}

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @UseGuards(AuthGuard) // Có Guard này thì req.user mới có dữ liệu!
  @Post('chat')
  async chat(
    @Req() req: RequestWithUser,
    @Body() body: { messages: { role: string; content: string }[] },
  ) {
    const chatHistory = body.messages || [];

    // Lấy ID từ Token đã được giải mã
    const userId = req.user?.id || req.user?.sub;

    if (!userId) {
      throw new UnauthorizedException(
        'Không tìm thấy thông tin xác thực. Vui lòng đăng nhập lại!',
      );
    }

    return this.aiService.processChat(chatHistory, String(userId));
  }
}
