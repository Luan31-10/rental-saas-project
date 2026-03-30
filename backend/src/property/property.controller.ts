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
}
