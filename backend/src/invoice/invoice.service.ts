import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { PayosService } from '../payos/payos.service'; // 🔥 1. IMPORT PAYOS VÀO ĐÂY SẾP NHÉ
import { Prisma } from '@prisma/client';

export class CreateInvoiceDto {
  roomId: string;
  electricity: number;
  water: number;
  month: number;
  year: number;
}

@Injectable()
export class InvoiceService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
    private payosService: PayosService,
  ) {}

  async create(data: CreateInvoiceDto) {
    const existingInvoice = await this.prisma.invoice.findFirst({
      where: { roomId: data.roomId, month: data.month, year: data.year },
    });

    if (existingInvoice) {
      throw new BadRequestException(
        `Phòng này đã được xuất hóa đơn trong tháng ${data.month}/${data.year}!`,
      );
    }

    const room = await this.prisma.room.findUnique({
      where: { id: data.roomId },
      include: { tenants: { where: { status: 'ACTIVE' } } },
    });

    if (!room) throw new BadRequestException('Không tìm thấy thông tin phòng');

    const totalAmount =
      room.price + data.electricity * 3500 + data.water * 15000;

    const newInvoice = await this.prisma.invoice.create({
      data: {
        roomId: data.roomId,
        electricity: data.electricity,
        water: data.water,
        amount: totalAmount,
        month: data.month,
        year: data.year,
        status: 'PENDING',
      },
    });

    if (room.tenants && room.tenants.length > 0) {
      const mainTenant = room.tenants[0];
      if (mainTenant.email) {
        // 🔥 3. LẤY LINK THANH TOÁN TỪ PAYOS NGAY KHI VỪA TẠO HÓA ĐƠN XONG
        let checkoutUrl = '';
        try {
          const payosRes = await this.payosService.createPaymentLink(
            newInvoice.id,
          );
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          checkoutUrl = payosRes.checkoutUrl;
        } catch (error) {
          console.error('Lỗi lấy link PayOS:', error);
          checkoutUrl = 'http://localhost:3001/tenants/dashboard';
        }

        // 🔥 4. TRUYỀN THÊM CÁI checkoutUrl VÀO HÀM GỬI MAIL
        await this.mailService.sendInvoiceEmail(
          mainTenant.email,
          mainTenant.name,
          room.roomNumber,
          data.month,
          data.electricity,
          data.water,
          totalAmount,
          checkoutUrl, // <--- Cục vàng ở đây
        );
      }
    }

    return newInvoice;
  }

  async findAll(propertyId?: string, month?: number, year?: number) {
    const whereCondition: Prisma.InvoiceWhereInput = {};

    if (propertyId && propertyId !== 'undefined') {
      whereCondition.room = { propertyId: propertyId };
    }

    const parsedMonth = Number(month);
    if (!Number.isNaN(parsedMonth) && parsedMonth > 0) {
      whereCondition.month = parsedMonth;
    }

    const parsedYear = Number(year);
    if (!Number.isNaN(parsedYear) && parsedYear > 0) {
      whereCondition.year = parsedYear;
    }

    return this.prisma.invoice.findMany({
      where: whereCondition,
      include: {
        room: {
          include: {
            tenants: {
              where: {
                status: 'ACTIVE',
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async updateStatus(id: string, status: string) {
    return this.prisma.invoice.update({ where: { id }, data: { status } });
  }

  async remove(id: string) {
    return this.prisma.invoice.delete({ where: { id } });
  }

  async findAllByOwner(email: string) {
    return this.prisma.invoice.findMany({
      where: { room: { property: { owner: { email: email } } } },
    });
  }

  // 🔥 HÀM NÀY DÙNG ĐỂ BẮN EMAIL NHẮC NỢ
  async sendReminder(id: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: {
        room: { include: { tenants: { where: { status: 'ACTIVE' } } } },
      },
    });

    if (!invoice || !invoice.room || invoice.room.tenants.length === 0) {
      throw new BadRequestException(
        'Không tìm thấy thông tin khách thuê để gửi mail',
      );
    }

    const tenant = invoice.room.tenants[0];
    if (!tenant.email) {
      throw new BadRequestException(
        'Khách thuê này chưa đăng ký địa chỉ email',
      );
    }

    // 🔥 5. CŨNG PHẢI LẤY LINK THANH TOÁN CHO CÁI EMAIL NHẮC NỢ LUÔN
    let checkoutUrl = '';
    try {
      const payosRes = await this.payosService.createPaymentLink(invoice.id);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      checkoutUrl = payosRes.checkoutUrl;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      checkoutUrl = 'http://localhost:3001/tenants/dashboard';
    }

    await this.mailService.sendReminderEmail(
      tenant.email,
      tenant.name,
      invoice.room.roomNumber,
      invoice.amount,
      invoice.month,
      checkoutUrl,
    );

    return { message: 'Đã gửi email nhắc nhở thành công' };
  }

  async getHistoryByUserId(userId: string) {
    return this.prisma.invoice.findMany({
      where: {
        room: {
          tenants: {
            some: {
              userAccountId: userId, // Mấu chốt từ file schema của sếp nằm ở đây!
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' }, // Xếp hóa đơn mới nhất lên đầu
    });
  }
}
