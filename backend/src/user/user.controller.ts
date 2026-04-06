import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Body,
  Req,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { UserService } from './user.service';
import { AuthGuard } from '../auth/auth.guard';
import { Request } from 'express';
import { existsSync, mkdirSync } from 'fs';

interface RequestWithUser extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    sub?: string;
  };
}

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(AuthGuard)
  @Get('profile')
  getProfile(@Req() req: RequestWithUser) {
    const userId = req.user?.id || req.user?.sub;
    if (!userId) throw new BadRequestException('User ID không hợp lệ');
    return this.userService.getProfile(String(userId));
  }

  @UseGuards(AuthGuard)
  @Patch('profile')
  updateProfile(
    @Req() req: RequestWithUser,
    @Body()
    updateData: {
      name?: string;
      phone?: string;
      address?: string;
      avatar?: string;
      bankId?: string;
      bankAccount?: string;
      bankAccountName?: string;
    },
  ) {
    const userId = req.user?.id || req.user?.sub;
    if (!userId) throw new BadRequestException('User ID không hợp lệ');
    return this.userService.updateProfile(String(userId), updateData);
  }

  // ==========================================
  // 🔥 KHU VỰC XỬ LÝ ẢNH ĐẠI DIỆN (AVATAR)
  // ==========================================

  // 🔥 ĐÃ FIX: Xóa bớt 1 cục khai báo thừa thãi! Chỉ dùng 1 lần duy nhất!
  @UseGuards(AuthGuard)
  @Post('avatar')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = './uploads/avatars';
          if (!existsSync(uploadPath)) {
            mkdirSync(uploadPath, { recursive: true });
          }
          cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `${uniqueSuffix}${ext}`);
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 }, // Giới hạn 5MB
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
          return cb(new BadRequestException('Chỉ chấp nhận file ảnh'), false);
        }
        cb(null, true);
      },
    }),
  )
  async uploadAvatar(
    @Req() req: RequestWithUser,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Không tìm thấy file tải lên');
    }

    const userId = req.user?.id || req.user?.sub;

    if (!userId) {
      throw new BadRequestException('User ID không hợp lệ');
    }

    const avatarUrl = `/uploads/avatars/${file.filename}`;

    try {
      await this.userService.updateProfile(String(userId), {
        avatar: avatarUrl,
      });
    } catch (error) {
      console.error(`LỖI UPDATE USER ${userId}:`, error);
      throw new BadRequestException('Lỗi lưu ảnh vào Database');
    }

    return {
      message: 'Cập nhật ảnh đại diện thành công',
      avatarUrl,
    };
  }

  // 🔥 THÊM LUÔN CÁI HÀM XÓA ẢNH CHO ĐỦ BỘ (Frontend gọi API DELETE)
  @UseGuards(AuthGuard)
  @Delete('avatar')
  async deleteAvatar(@Req() req: RequestWithUser) {
    const userId = req.user?.id || req.user?.sub;
    if (!userId) throw new BadRequestException('User ID không hợp lệ');

    await this.userService.deleteAvatar(String(userId));
    return { message: 'Đã xóa ảnh đại diện' };
  }
}
