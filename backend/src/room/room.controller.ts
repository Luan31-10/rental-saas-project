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
} from '@nestjs/common';
import { RoomService, UpdateRoomDto } from './room.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { AuthGuard } from '../auth/auth.guard';

@Controller('room')
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  @UseGuards(AuthGuard)
  @Post()
  create(@Body() createRoomDto: CreateRoomDto) {
    return this.roomService.create(createRoomDto);
  }

  @UseGuards(AuthGuard)
  @Get()
  findAll(@Query('propertyId') propertyId: string) {
    return this.roomService.findByProperty(propertyId);
  }

  // Thêm Endpoint Sửa phòng
  @UseGuards(AuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateData: UpdateRoomDto) {
    return this.roomService.update(id, updateData);
  }

  // Thêm Endpoint Xóa phòng
  @UseGuards(AuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.roomService.remove(id);
  }

  @UseGuards(AuthGuard)
  @Post(':id/checkout')
  checkoutRoom(@Param('id') id: string) {
    return this.roomService.checkout(id);
  }
}
