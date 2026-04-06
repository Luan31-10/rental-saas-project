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
    private payosService: PayosService,
  ) {}

  // =========================================================================
  // 🤖 ROBOT 1: NHẮC NỢ TIỀN PHÒNG (Chạy 8h sáng mỗi ngày)
  // =========================================================================
  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async handleInvoiceReminders() {
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

          await this.mailService.sendReminderEmail(
            tenant.email,
            tenant.name,
            invoice.room.roomNumber,
            invoice.amount,
            invoice.month,
            checkoutUrl,
          );
        }
      }
    }

    this.logger.debug(
      `Đã quét xong và gửi nhắc nợ cho ${unpaidInvoices.length} phòng!`,
    );
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleExpiredPlans() {
    this.logger.debug('Bắt đầu quét kiểm tra gói cước hết hạn...');
    const today = new Date();

    try {
      // Tìm tất cả những Chủ trọ ĐANG CÓ GÓI (khác FREE) và ĐÃ QUÁ HẠN
      const expiredUsers = await this.prisma.user.findMany({
        where: {
          plan: { not: 'FREE' },
          planExpiryDate: { lt: today }, // nhỏ hơn ngày hôm nay
        },
        select: { id: true, email: true, plan: true },
      });

      if (expiredUsers.length === 0) {
        this.logger.debug('✅ Không có tài khoản nào hết hạn hôm nay.');
        return;
      }

      // Giáng cấp tất cả ông hết hạn về FREE
      const result = await this.prisma.user.updateMany({
        where: {
          id: { in: expiredUsers.map((user) => user.id) },
        },
        data: {
          plan: 'FREE',
          planExpiryDate: null,
        },
      });

      this.logger.debug(
        `🔻 Đã tự động hạ cấp ${result.count} tài khoản về gói Starter (FREE).`,
      );
    } catch (error) {
      this.logger.error('❌ Lỗi khi chạy Robot hạ cấp:', error);
    }
  }
}
