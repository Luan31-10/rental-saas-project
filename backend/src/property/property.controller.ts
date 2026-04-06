import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
  Param,
  Delete,
  Patch,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { PropertyService } from './property.service';
import { CreateProperty } from './dto/create-property.dto';
import { AuthGuard } from '../auth/auth.guard';
import { Request as ExpressRequest } from 'express';

interface RequestWithUser extends ExpressRequest {
  user: {
    id: string;
    email: string;
    role: string;
  };
}

interface PricingBody {
  baseElectricityPrice: number | string;
  baseWaterPrice: number | string;
  defaultRoomPrice: number | string;
}

@Controller('property')
export class PropertyController {
  constructor(private readonly propertyService: PropertyService) {}

  @UseGuards(AuthGuard)
  @Post()
  create(
    @Body() createPropertyDto: CreateProperty,
    @Request() req: RequestWithUser,
  ) {
    const ownerId = req.user.id;
    return this.propertyService.create(createPropertyDto, ownerId);
  }

  @UseGuards(AuthGuard)
  @Get()
  findAll(@Request() req: RequestWithUser) {
    return this.propertyService.findAll(req.user.id);
  }

  // Thêm Endpoint Sửa khu trọ
  @UseGuards(AuthGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateData: { name?: string; address?: string },
  ) {
    return this.propertyService.update(id, updateData);
  }

  @UseGuards(AuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.propertyService.remove(id);
  }
  @UseGuards(AuthGuard)
  @Patch(':id/pricing')
  async updatePricing(
    @Param('id') id: string,
    @Body() body: PricingBody,
    @Req() req: RequestWithUser,
  ) {
    const userId = req.user.id; // Bây giờ req.user đã có dữ liệu, sẽ không lỗi nữa

    if (!userId) {
      throw new UnauthorizedException(
        'Không tìm thấy thông tin sếp. Vui lòng đăng nhập lại!',
      );
    }

    return this.propertyService.updatePricing(id, String(userId), body);
  }
}
