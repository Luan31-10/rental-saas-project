import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // Gắn mác Global để module nào cũng dùng được mà không cần import lại
@Module({
  providers: [PrismaService],
  exports: [PrismaService], // Xuất ra cho thiên hạ xài
})
export class PrismaModule {}
