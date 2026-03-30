import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { PrismaModule } from '../prisma/prisma.module'; // Import thêm dòng này

@Module({
  imports: [PrismaModule], // Khai báo vào mảng imports
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
