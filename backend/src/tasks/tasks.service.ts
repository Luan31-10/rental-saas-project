import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { PayosService } from '../payos/payos.service';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
    private payosService: PayosService, // 🔥 2. NHÚNG PAYOS VÀO CONSTRUCTOR
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_8AM) // Chạy tự động 8h sáng mỗi ngày
  async handleCron() {
    this.logger.debug('Bắt đầu quét danh sách nợ tiền phòng...');

    const unpaidInvoices = await this.prisma.invoice.findMany({
      where: { status: 'PENDING' },
      include: {
        room: { include: { tenants: { where: { status: 'ACTIVE' } } } },
      },
    });

    if (unpaidInvoices.length === 0) {
      this.logger.debug('Không có ai nợ tiền, hệ thống tiếp tục đi ngủ!');
      return;
    }

    for (const invoice of unpaidInvoices) {
      if (invoice.room && invoice.room.tenants.length > 0) {
        const tenant = invoice.room.tenants[0];
        if (tenant.email) {
          // 🔥 3. TẠO LINK PAYOS CHO CÁI HÓA ĐƠN ĐANG NỢ NÀY
          let checkoutUrl = '';
          try {
            const payosRes = await this.payosService.createPaymentLink(
              invoice.id,
            );
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            checkoutUrl = payosRes.checkoutUrl;
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
          } catch (error) {
            this.logger.error(`Lỗi tạo link PayOS cho hóa đơn ${invoice.id}`);
            const frontendUrl =
              process.env.FRONTEND_URL || 'http://localhost:3001';
            checkoutUrl = `${frontendUrl}/tenants/dashboard`;
          }

          // 🔥 4. TRUYỀN checkoutUrl VÀO LÀM THAM SỐ THỨ 6
          await this.mailService.sendReminderEmail(
            tenant.email,
            tenant.name,
            invoice.room.roomNumber,
            invoice.amount,
            invoice.month,
            checkoutUrl, // <--- Truyền vào đây là hết lỗi!
          );
        }
      }
    }

    this.logger.debug(
      `Đã quét xong và gửi nhắc nợ cho ${unpaidInvoices.length} phòng!`,
    );
  }
}
