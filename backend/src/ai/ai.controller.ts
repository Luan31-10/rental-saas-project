import { Controller, Post, Body } from '@nestjs/common';
import { AiService } from './ai.service';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('chat')
  async chat(@Body() body: { messages: { role: string; content: string }[] }) {
    // 1. Kiểm tra nếu body.messages không tồn tại thì gán bằng mảng rỗng
    const chatHistory = body.messages || [];
    // 2. Truyền mảng lịch sử xuống Service
    return this.aiService.processChat(chatHistory);
  }
}
