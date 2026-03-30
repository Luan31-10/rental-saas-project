import { Module } from '@nestjs/common';
import { PayosService } from './payos.service';
import { PayosController } from './payos.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PayosController],
  providers: [PayosService],
  exports: [PayosService],
})
export class PayosModule {}
