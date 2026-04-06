import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  // 1. Lấy profile theo ID (Chuẩn nhất cho AuthGuard)
  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        address: true,
        avatar: true,
        role: true,
        plan: true,
        planExpiryDate: true,
        bankId: true,
        bankAccount: true,
        bankAccountName: true,
        isTwoFactorEnabled: true,
        createdAt: true,
      },
    });

    if (!user) throw new NotFoundException('Không tìm thấy người dùng');
    return user;
  }

  // 2. Cập nhật Profile (Dùng ID thay vì Email để tránh nhầm lẫn)
  async updateProfile(
    userId: string, // Đã đổi tên cho sếp dễ hình dung
    updateData: {
      name?: string;
      phone?: string;
      address?: string;
      avatar?: string | null;
      bankId?: string;
      bankAccount?: string;
      bankAccountName?: string;
    },
  ) {
    return this.prisma.user.update({
      where: { id: userId }, // 🔥 ĐÃ FIX: Tìm theo ID
      data: {
        name: updateData.name,
        phone: updateData.phone,
        address: updateData.address,
        avatar: updateData.avatar, // 🔥 ĐÃ FIX: Đưa avatar vào đây để nó chịu lưu
        bankId: updateData.bankId,
        bankAccount: updateData.bankAccount,
        bankAccountName: updateData.bankAccountName,
      },
    });
  }

  // 3. Cập nhật riêng Avatar (Dùng ID)
  async updateAvatar(userId: string, avatarUrl: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { avatar: avatarUrl },
    });
  }

  // 4. Xóa Avatar (Dùng ID)
  async deleteAvatar(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { avatar: null },
    });
  }

  // --- Các hàm khác giữ nguyên hoặc chỉnh lại ID cho khớp ---

  async getProfileByEmail(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new NotFoundException('Không tìm thấy tài khoản');
    return user;
  }

  async create(createUserDto: CreateUserDto) {
    return this.prisma.user.create({
      data: {
        email: createUserDto.email,
        name: createUserDto.name,
        role: 'OWNER',
      },
    });
  }

  async findAll() {
    return this.prisma.user.findMany();
  }

  async findOne(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    return this.prisma.user.update({
      where: { id },
      data: updateUserDto,
    });
  }

  async remove(id: string) {
    return this.prisma.user.delete({ where: { id } });
  }
}
