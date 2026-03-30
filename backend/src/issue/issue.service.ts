import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IssueGateway } from './issue.gateway';

export class CreateIssueDto {
  title: string;
  description?: string;
  roomId?: string;
}

@Injectable()
export class IssueService {
  // 🔥 LỖI Ở ĐÂY: Phải có chữ "private" trước issueGateway thì NestJS mới tự động tạo biến cho xài
  constructor(
    private prisma: PrismaService,
    private issueGateway: IssueGateway,
  ) {}

  // 1. KHÁCH THUÊ: Báo cáo sự cố mới
  async create(data: CreateIssueDto, email: string) {
    const tenant = await this.prisma.tenant.findFirst({
      where: { email: email, status: 'ACTIVE' },
    });

    if (!tenant)
      throw new NotFoundException(
        'Không tìm thấy thông tin khách thuê hợp lệ.',
      );
    if (!tenant.roomId)
      throw new BadRequestException(
        'Tài khoản này chưa được gán vào phòng nào.',
      );

    return this.prisma.issue.create({
      data: {
        title: data.title,
        description: data.description,
        roomId: tenant.roomId,
        tenantId: tenant.id,
      },
    });
  }

  // 2. KHÁCH THUÊ: Xem danh sách sự cố mình đã báo
  async getMyIssues(email: string) {
    const tenant = await this.prisma.tenant.findFirst({
      where: { email: email, status: 'ACTIVE' },
    });
    if (!tenant) return [];

    return this.prisma.issue.findMany({
      where: { tenantId: tenant.id },
      orderBy: { createdAt: 'desc' },
      include: { room: { select: { roomNumber: true } } },
    });
  }

  // 3. CHỦ NHÀ: Xem toàn bộ sự cố của một khu trọ
  async getIssuesByProperty(propertyId: string) {
    return this.prisma.issue.findMany({
      where: { room: { propertyId: propertyId } },
      include: {
        room: { select: { roomNumber: true } },
        tenant: { select: { name: true, phone: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // 4. CHỦ NHÀ: Cập nhật trạng thái
  async updateStatus(id: string, status: string) {
    return this.prisma.issue.update({
      where: { id },
      data: { status },
    });
  }

  // 5. Xóa sự cố
  async remove(id: string) {
    return this.prisma.issue.delete({ where: { id } });
  }

  // 🔥 2 HÀM MỚI: XỬ LÝ NHẮN TIN TRONG SỰ CỐ
  async addComment(issueId: string, content: string, sender: string) {
    const newComment = await this.prisma.issueComment.create({
      data: { issueId, content, sender },
    });

    // Gọi hàm phát sóng qua WebSocket
    this.issueGateway.broadcastNewComment(issueId, newComment);

    return newComment;
  }

  async getComments(issueId: string) {
    return await this.prisma.issueComment.findMany({
      where: { issueId },
      orderBy: { createdAt: 'asc' },
    });
  }
}
