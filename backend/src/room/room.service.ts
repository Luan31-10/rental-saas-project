import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CreateRoomDto } from './dto/create-room.dto';
import { PrismaService } from '../prisma/prisma.service';

export class UpdateRoomDto {
  roomNumber?: string;
  price?: number;
  area?: number;
  status?: string;
}

@Injectable()
export class RoomService {
  constructor(private prisma: PrismaService) {}

  async create(createRoomDto: CreateRoomDto) {
    const property = await this.prisma.property.findUnique({
      where: { id: createRoomDto.propertyId },
      include: { owner: true },
    });

    if (!property) throw new NotFoundException('Không tìm thấy khu trọ!');

    const currentRoomCount = await this.prisma.room.count({
      where: {
        property: {
          ownerId: property.ownerId,
        },
      },
    });

    let maxRooms = 10;
    if (property.owner.plan === 'PRO') maxRooms = 50;
    if (property.owner.plan === 'ENTERPRISE') maxRooms = 99999;

    if (currentRoomCount >= maxRooms) {
      throw new ForbiddenException({
        message: `Gói ${property.owner.plan === 'FREE' ? 'Starter' : property.owner.plan} hiện tại chỉ cho phép quản lý tối đa ${maxRooms} phòng!`,
        code: 'UPGRADE_REQUIRED',
      });
    }

    return this.prisma.room.create({
      data: {
        roomNumber: createRoomDto.roomNumber,
        price: createRoomDto.price,
        area: createRoomDto.area,
        propertyId: createRoomDto.propertyId,
      },
      include: { tenants: { where: { status: 'ACTIVE' } } },
    });
  }

  async findByProperty(propertyId: string) {
    return this.prisma.room.findMany({
      where: { propertyId },
      include: {
        tenants: {
          where: { status: 'ACTIVE' },
        },
      },
      orderBy: { roomNumber: 'asc' },
    });
  }

  async update(id: string, updateData: UpdateRoomDto) {
    return this.prisma.room.update({
      where: { id },
      data: updateData,
      include: { tenants: { where: { status: 'ACTIVE' } } },
    });
  }

  async remove(id: string) {
    return this.prisma.room.delete({
      where: { id },
    });
  }

  // ========================================================
  // 🔥 TÍNH NĂNG MỚI: XỬ LÝ TRẢ PHÒNG & TÍNH TIỀN LẺ (CHỐT SỔ)
  // ========================================================
  async checkout(roomId: string) {
    // 1. Kiểm tra phòng và lấy thông tin khách đang ở
    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
      include: { tenants: { where: { status: 'ACTIVE' } } },
    });

    if (!room) {
      throw new NotFoundException('Không tìm thấy phòng này!');
    }

    if (!room.tenants || room.tenants.length === 0) {
      throw new BadRequestException(
        'Phòng đang trống, không có khách để trả phòng!',
      );
    }

    const tenant = room.tenants[0]; // Lấy khách hàng hiện tại

    // 2. Tính toán tiền phòng lẻ (Chốt sổ ngày cuối)
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate(); // Số ngày trong tháng này

    let finalRent = room.price; // Mặc định là nguyên tháng

    const isMovedInThisMonth =
      tenant.startDate.getMonth() + 1 === currentMonth &&
      tenant.startDate.getFullYear() === currentYear;

    const startDay = isMovedInThisMonth ? tenant.startDate.getDate() : 1;
    const endDay = today.getDate(); // Ngày trả phòng là hôm nay

    // Tính tổng số ngày ở thực tế trong tháng này
    const daysStayed = endDay - startDay + 1;

    // Nếu ở chưa đủ tháng -> CẮT TIỀN LẺ
    if (daysStayed > 0 && daysStayed < daysInMonth) {
      finalRent = Math.round((room.price / daysInMonth) * daysStayed);
    } else if (daysStayed <= 0) {
      finalRent = 0;
    }

    // 🔥 CỨU TINH Ở ĐÂY: Tạo ra 1 cái mã orderCode ngẫu nhiên để chống lỗi P2002 của Prisma
    const uniqueOrderCode =
      Number(String(Date.now()).slice(-8)) + Math.floor(Math.random() * 1000);

    // 3. Tạo Hóa đơn "Chốt sổ" (Final Invoice)
    const finalInvoice = await this.prisma.invoice.create({
      data: {
        roomId: room.id,
        amount: finalRent,
        electricity: 0,
        water: 0,
        month: currentMonth,
        year: currentYear,
        status: 'PENDING',
        orderCode: uniqueOrderCode, // Đã bơm mã ngẫu nhiên vào đây
      },
    });

    // 4. Tiễn khách & Dọn phòng
    await this.prisma.tenant.update({
      where: { id: tenant.id },
      data: { status: 'INACTIVE', endDate: today },
    });

    await this.prisma.room.update({
      where: { id: roomId },
      data: { status: 'AVAILABLE' },
    });

    // 5. Báo cáo về kết quả
    let message = `Đã trả phòng thành công! Hóa đơn tháng ${currentMonth} được tính nguyên tháng (${room.price.toLocaleString('vi-VN')}đ).`;
    if (finalRent < room.price) {
      message = `Đã trả phòng thành công! Khách chỉ ở ${daysStayed} ngày trong tháng ${currentMonth}. Hóa đơn chốt sổ là: ${finalRent.toLocaleString('vi-VN')}đ.`;
    }

    return {
      success: true,
      message,
      invoice: finalInvoice,
    };
  }
}
