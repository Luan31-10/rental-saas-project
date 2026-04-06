/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class PayosService {
  private readonly clientId = process.env.PAYOS_CLIENT_ID;
  private readonly apiKey = process.env.PAYOS_API_KEY;
  private readonly checksumKey = process.env.PAYOS_CHECKSUM_KEY;
  private readonly payosUrl =
    'https://api-merchant.payos.vn/v2/payment-requests';

  constructor(private prisma: PrismaService) {
    if (!this.clientId || !this.apiKey || !this.checksumKey) {
      console.error('❌ [PayOS] THIẾU KEY TRONG FILE .env');
    } else {
      console.log('✅ [PayOS] Đã sẵn sàng gọi API trực tiếp!');
    }
  }

  // --- HÀM 1: TỰ TẠO CHỮ KÝ (SIGNATURE) ---
  private createSignature(data: any): string {
    const sortedKeys = Object.keys(data).sort();
    const dataStr = sortedKeys.map((key) => `${key}=${data[key]}`).join('&');
    return crypto
      .createHmac('sha256', this.checksumKey as string)
      .update(dataStr)
      .digest('hex');
  }

  // --- HÀM 2: TẠO LINK THANH TOÁN TIỀN PHÒNG (CHO KHÁCH THUÊ) ---
  async createPaymentLink(invoiceId: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { room: true },
    });

    if (!invoice) throw new BadRequestException('Không tìm thấy hóa đơn này!');
    if (invoice.status === 'PAID')
      throw new BadRequestException('Hóa đơn đã thanh toán!');

    const orderCode = Math.floor(Math.random() * 900000) + 100000;
    const amount = Number(invoice.amount) || 2000;
    const description = `TT phong ${invoice.room?.roomNumber}`
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .substring(0, 25);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    const returnUrl = `${frontendUrl}/tenants/dashboard`;
    const cancelUrl = `${frontendUrl}/tenants/dashboard`;

    await this.prisma.invoice.update({
      where: { id: invoiceId },
      data: { orderCode: orderCode },
    });

    const signatureData = {
      amount,
      cancelUrl,
      description,
      orderCode,
      returnUrl,
    };
    const signature = this.createSignature(signatureData);
    const requestBody = { ...signatureData, signature: signature };

    try {
      const response = await fetch(this.payosUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-client-id': this.clientId as string,
          'x-api-key': this.apiKey as string,
        },
        body: JSON.stringify(requestBody),
      });

      const resData: any = await response.json();

      if (resData.code !== '00') {
        console.error('❌ Lỗi từ PayOS Server:', resData);
        throw new BadRequestException(
          'Lỗi từ cổng thanh toán: ' + resData.desc,
        );
      }

      return { checkoutUrl: resData.data.checkoutUrl };
    } catch (error) {
      console.error('❌ Lỗi Call API PayOS:', error);
      throw new BadRequestException('Không thể kết nối PayOS');
    }
  }

  // --- HÀM 3: TẠO LINK THANH TOÁN MUA GÓI (CHO CHỦ TRỌ) ---
  async createUpgradeLink(email: string, planId: string) {
    const user = await this.prisma.user.findUnique({ where: { email: email } });
    if (!user) throw new BadRequestException('Không tìm thấy tài khoản!');

    // Set giá thật theo gói
    let amount = 0;
    if (planId === 'PRO') amount = 2000;
    else if (planId === 'ENTERPRISE') amount = 999000;
    else throw new BadRequestException('Gói không hợp lệ!');

    // 🔥 ĐÃ XÓA DÒNG ÉP GIÁ 2000Đ

    const orderCode = Math.floor(Math.random() * 900000) + 100000;

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        upgradeOrderCode: orderCode,
        pendingPlan: planId,
      },
    });

    const description = `Nang cap ${planId}`.substring(0, 25);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';

    const returnUrl = `${frontendUrl}/settings?upgrade=success`;
    const cancelUrl = `${frontendUrl}/settings?upgrade=cancel`;
    const signatureData = {
      amount,
      cancelUrl,
      description,
      orderCode,
      returnUrl,
    };
    const signature = this.createSignature(signatureData);
    const requestBody = { ...signatureData, signature: signature };

    try {
      const response = await fetch(this.payosUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-client-id': this.clientId as string,
          'x-api-key': this.apiKey as string,
        },
        body: JSON.stringify(requestBody),
      });

      const resData: any = await response.json();

      if (resData.code !== '00')
        throw new BadRequestException('Lỗi PayOS: ' + resData.desc);

      return { checkoutUrl: resData.data.checkoutUrl };
    } catch (error) {
      console.error('❌ Lỗi Call API Upgrade PayOS:', error);
      throw new BadRequestException('Không thể kết nối với PayOS');
    }
  }

  // --- HÀM 4: XỬ LÝ WEBHOOK (PAYOS GỌI VỀ) ---
  async handleWebhook(body: any) {
    try {
      const { data } = body;

      if (data && body.code === '00') {
        const orderCode = Number(data.orderCode);

        // 1. Kiểm tra xem có phải tiền Hóa đơn Khách thuê?
        const invoice = await this.prisma.invoice.findFirst({
          where: { orderCode },
        });

        if (invoice) {
          // 👉 TRƯỜNG HỢP 1: Tiền nhà
          await this.prisma.invoice.update({
            where: { id: invoice.id },
            data: { status: 'PAID' },
          });
          console.log(`✅ [PayOS] Thu tiền phòng thành công đơn: ${orderCode}`);
        } else {
          // 👉 TRƯỜNG HỢP 2: Tiền mua Gói dịch vụ của Chủ trọ
          const user = await this.prisma.user.findFirst({
            where: { upgradeOrderCode: orderCode },
          });

          if (user) {
            const expiryDate = new Date();
            expiryDate.setMonth(expiryDate.getMonth() + 1);

            await this.prisma.user.update({
              where: { id: user.id },
              data: {
                plan: user.pendingPlan as any,
                planExpiryDate: expiryDate,
                upgradeOrderCode: null,
                pendingPlan: null,
              },
            });
            console.log(
              `✅ [PayOS] Chủ trọ ${user.name} đã nâng cấp thành công gói ${user.pendingPlan}`,
            );
          }
        }
      }
      return { success: true };
    } catch (error) {
      console.error('❌ Lỗi Webhook:', error);
      return { success: false };
    }
  }
  async downgradeToFree(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new BadRequestException('Không tìm thấy tài khoản!');

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        plan: 'FREE',
        planExpiryDate: null,
        pendingPlan: null,
        upgradeOrderCode: null,
      },
    });

    return { success: true, message: 'Đã hạ cấp về gói Starter!' };
  }
}
