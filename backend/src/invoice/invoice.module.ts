import { Module } from '@nestjs/common';
import { InvoiceService } from './invoice.service';
import { InvoiceController } from './invoice.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { PayosModule } from '../payos/payos.module';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [PrismaModule, MailModule, PayosModule],
  controllers: [InvoiceController],
  providers: [InvoiceService],
})
export class InvoiceModule {}
