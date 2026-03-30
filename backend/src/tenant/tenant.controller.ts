import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Query,
  Patch,
  Param,
  Delete,
  Request,
} from '@nestjs/common';
import {
  TenantService,
  CreateTenantDto,
  UpdateTenantDto,
} from './tenant.service';
import { AuthGuard } from '../auth/auth.guard';

// Định nghĩa khuôn mẫu cho Request để dập tắt lỗi của ESLint
interface RequestWithUser {
  user: {
    email: string;
    role?: string;
  };
}

@Controller('tenant')
@UseGuards(AuthGuard) // Bảo vệ API, bắt buộc phải đăng nhập
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  // --- API DÀNH RIÊNG CHO KHÁCH THUÊ ---
  @Get('my-room')
  getMyRoom(@Request() req: RequestWithUser) {
    return this.tenantService.getMyRoomInfo(req.user.email);
  }

  // 🔥 API LẤY NGÂN HÀNG CHỦ TRỌ (Gắn cho Payment Modal)
  @Get('landlord-bank')
  getLandlordBank(@Request() req: RequestWithUser) {
    return this.tenantService.getLandlordBankInfo(req.user.email);
  }

  // --- CÁC API CỦA CHỦ TRỌ ---
  @Post()
  create(@Body() data: CreateTenantDto) {
    return this.tenantService.create(data);
  }

  @Get()
  findAll(@Query('propertyId') propertyId: string) {
    return this.tenantService.findAllByProperty(propertyId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: UpdateTenantDto) {
    return this.tenantService.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.tenantService.remove(id);
  }
}
