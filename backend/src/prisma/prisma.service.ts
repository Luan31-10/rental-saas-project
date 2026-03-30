import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    console.log('🔌 Đang kết nối tới MongoDB Atlas...');
    await this.$connect();
    console.log('✅ Đã kết nối Database thành công!');
  }
}
