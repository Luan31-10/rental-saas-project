import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TenantGateway } from './tenant.gateway';

export class CreateTenantDto {
  name: string;
  phone: string;
  email?: string;
  idCard?: string;
  deposit?: number | string;
  startDate?: string | Date;
  roomId: string;
}

export class UpdateTenantDto {
  name?: string;
  phone?: string;
  email?: string;
  idCard?: string;
  deposit?: number | string;
  startDate?: string | Date;
  endDate?: string | Date;
  status?: string;
}

@Injectable()
export class TenantService {
  constructor(
    private prisma: PrismaService,
    private tenantGateway: TenantGateway,
  ) {}

  async create(data: CreateTenantDto) {
    const tenant = await this.prisma.tenant.create({
      data: {
        name: data.name,
        phone: data.phone,
        email: data.email,
        idCard: data.idCard,
        deposit: Number(data.deposit) || 0,
        startDate: data.startDate ? new Date(data.startDate) : new Date(),
        roomId: data.roomId,
      },
    });

    await this.prisma.room.update({
      where: { id: data.roomId },
      data: { status: 'OCCUPIED' },
    });

    if (tenant.email) {
      this.tenantGateway.notifyRoomUpdate(tenant.email);
    }

    return tenant;
  }

  async findAllByProperty(propertyId: string) {
    return this.prisma.tenant.findMany({
      where: {
        room: {
          propertyId: propertyId,
        },
      },
      include: {
        room: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(id: string, updateData: UpdateTenantDto) {
    const { deposit, startDate, endDate, ...rest } = updateData;

    const dataToUpdate = {
      ...rest,
      ...(startDate ? { startDate: new Date(startDate) } : {}),
      ...(endDate ? { endDate: new Date(endDate) } : {}),
      ...(deposit !== undefined && deposit !== null
        ? { deposit: Number(deposit) }
        : {}),
    };

    const tenant = await this.prisma.tenant.update({
      where: { id },
      data: dataToUpdate,
    });

    if (updateData.status === 'INACTIVE') {
      const activeTenantsCount = await this.prisma.tenant.count({
        where: { roomId: tenant.roomId, status: 'ACTIVE' },
      });

      if (activeTenantsCount === 0) {
        await this.prisma.room.update({
          where: { id: tenant.roomId },
          data: { status: 'AVAILABLE' },
        });
      }
    }

    if (tenant.email) {
      this.tenantGateway.notifyRoomUpdate(tenant.email);
    }

    return tenant;
  }

  async remove(id: string) {
    const tenant = await this.prisma.tenant.delete({
      where: { id },
    });
    if (tenant.email) {
      this.tenantGateway.notifyRoomUpdate(tenant.email);
    }
    return tenant;
  }

  // --- PHẦN THÊM MỚI DÀNH CHO KHÁCH THUÊ ---
  async getMyRoomInfo(email: string) {
    const myRental = await this.prisma.tenant.findFirst({
      where: {
        email: email,
        status: 'ACTIVE',
      },
      include: {
        room: {
          include: {
            property: {
              include: { owner: true },
            },
            invoices: {
              where: { status: 'PENDING' },
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        },
      },
    });

    if (!myRental || !myRental.room) {
      throw new NotFoundException('Sếp chưa được gán vào phòng nào!');
    }

    const room = myRental.room;
    const property = room.property;
    const pendingInvoice = room.invoices[0];

    return {
      id: room.id, // Đây là ID phòng
      invoiceId: pendingInvoice ? pendingInvoice.id : null, // 🔥 THÊM DÒNG NÀY ĐỂ FRONTEND CÓ MÀ XÀI
      tenantName: myRental.name,
      roomNumber: room.roomNumber,
      propertyName: property.name,
      ownerName: property.owner?.name || 'Chủ nhà LuanEZ',
      price: room.price,
      area: room.area || 0,
      deposit: room.deposit || 0,
      balance: pendingInvoice ? pendingInvoice.amount : 0,
      status: pendingInvoice ? 'UNPAID' : 'PAID',
      dueDate: pendingInvoice
        ? `05/${pendingInvoice.month}/${pendingInvoice.year}`
        : 'Chưa có hóa đơn',
      startDate: myRental.startDate || myRental.createdAt,
    };
  }

  // 🔥 HÀM MỚI: LẤY THÔNG TIN NGÂN HÀNG CỦA CHỦ TRỌ
  async getLandlordBankInfo(tenantEmail: string) {
    const myRental = await this.prisma.tenant.findFirst({
      where: {
        email: tenantEmail,
        status: 'ACTIVE',
      },
      include: {
        room: {
          include: {
            property: {
              include: { owner: true }, // Truy xuất thông tin ông Chủ trọ
            },
          },
        },
      },
    });

    if (
      !myRental ||
      !myRental.room ||
      !myRental.room.property ||
      !myRental.room.property.owner
    ) {
      throw new NotFoundException(
        'Không tìm thấy thông tin Chủ trọ để thanh toán!',
      );
    }

    const landlord = myRental.room.property.owner;

    // Đã cập nhật Schema nên không cần ép kiểu nữa, gõ chuẩn chỉ luôn
    return {
      bankId: landlord.bankId || 'TCB',
      bankAccount: landlord.bankAccount || '19038975516014',
      bankAccountName: landlord.bankAccountName || 'VO THANH LUAN',
    };
  }
}
