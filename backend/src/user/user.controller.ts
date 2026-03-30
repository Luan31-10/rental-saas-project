import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthGuard } from '../auth/auth.guard';
import { Request as ExpressRequest } from 'express'; // Import cái này để fix lỗi any

// Định nghĩa chuẩn chỉ cho Request
interface RequestWithUser extends ExpressRequest {
  user: { email: string; id: string; role: string };
}

// Định nghĩa chuẩn cho cái body update
class UpdateProfileDto {
  name?: string;
  phone?: string;
  address?: string;
}

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  //  API LẤY PROFILE
  @UseGuards(AuthGuard)
  @Get('profile')
  getProfile(@Request() req: RequestWithUser) {
    return this.userService.getProfileByEmail(req.user.email);
  }

  //  API CẬP NHẬT PROFILE
  @UseGuards(AuthGuard)
  @Patch('profile')
  updateProfile(
    @Request() req: RequestWithUser,
    @Body() body: UpdateProfileDto,
  ) {
    return this.userService.updateProfile(req.user.email, body);
  }

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Get()
  findAll() {
    return this.userService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userService.remove(id);
  }
}
