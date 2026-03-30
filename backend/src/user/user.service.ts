import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async getProfileByEmail(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        role: true,
        createdAt: true,
        isTwoFactorEnabled: true,
      },
    });
    if (!user) throw new NotFoundException('Không tìm thấy tài khoản');
    return user;
  }

  async updateProfile(
    email: string,
    updateData: {
      // Đổi tên biến userId thành email cho đỡ nhầm
      name?: string;
      phone?: string;
      address?: string;
      bankId?: string;
      bankAccount?: string;
      bankAccountName?: string;
    },
  ) {
    return this.prisma.user.update({
      where: { email: email },
      data: {
        name: updateData.name,
        phone: updateData.phone,
        address: updateData.address,
        bankId: updateData.bankId,
        bankAccount: updateData.bankAccount,
        bankAccountName: updateData.bankAccountName,
      },
    });
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
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    return this.prisma.user.update({
      where: { id },
      data: updateUserDto,
    });
  }

  async remove(id: string) {
    return this.prisma.user.delete({
      where: { id },
    });
  }
}
