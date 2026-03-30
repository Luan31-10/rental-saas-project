import {
  Injectable,
  ForbiddenException,
  NotFoundException,
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
    // 1. Kiểm tra Khu trọ và kéo theo thông tin ông Chủ trọ
    const property = await this.prisma.property.findUnique({
      where: { id: createRoomDto.propertyId },
      include: { owner: true },
    });

    if (!property) throw new NotFoundException('Không tìm thấy khu trọ!');

    // 2. Đếm xem ông này đã tạo bao nhiêu phòng ở khu này rồi
    const currentRoomCount = await this.prisma.room.count({
      where: { propertyId: createRoomDto.propertyId },
    });

    // 3. Quy định "Luật chơi" dựa theo gói
    let maxRooms = 10; // FREE chỉ cho 10 phòng
    if (property.owner.plan === 'PRO') maxRooms = 50;
    if (property.owner.plan === 'ENTERPRISE') maxRooms = 99999;

    // 4. Nếu vượt rào -> Phạt thẻ đỏ ngay!
    if (currentRoomCount >= maxRooms) {
      throw new ForbiddenException({
        message: `Gói ${property.owner.plan} hiện tại chỉ cho phép tối đa ${maxRooms} phòng!`,
        code: 'UPGRADE_REQUIRED', // 🔥 Ám hiệu để Frontend bắt bài
      });
    }

    // 5. Nếu chưa vượt giới hạn thì cho qua
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
}
