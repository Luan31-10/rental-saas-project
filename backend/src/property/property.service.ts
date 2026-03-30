import { Injectable } from '@nestjs/common';
import { CreateProperty } from './dto/create-property.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PropertyService {
  constructor(private prisma: PrismaService) {}

  async create(createPropertyDto: CreateProperty, ownerId: string) {
    return this.prisma.property.create({
      data: {
        name: createPropertyDto.name,
        address: createPropertyDto.address,
        ownerId: ownerId,
      },
    });
  }

  async findAll(ownerId: string) {
    return this.prisma.property.findMany({
      where: { ownerId },
      include: {
        rooms: true,
      },
    });
  }

  // Thêm hàm Update
  async update(id: string, updateData: { name?: string; address?: string }) {
    return this.prisma.property.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: string) {
    return this.prisma.property.delete({
      where: { id },
    });
  }
}
