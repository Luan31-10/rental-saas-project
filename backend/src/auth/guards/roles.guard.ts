import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

// Định nghĩa cấu trúc User để "khóa miệng" ESLint
interface RequestUser {
  id: string;
  email: string;
  role: string;
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 1. Lấy Roles yêu cầu từ Decorator
    const requiredRoles = this.reflector.get<string[]>(
      'roles',
      context.getHandler(),
    );

    // Nếu API không yêu cầu role cụ thể thì cho qua luôn
    if (!requiredRoles) return true;

    // 2. Lấy Request và ép kiểu cho User
    const request = context.switchToHttp().getRequest<{ user?: RequestUser }>();
    const user = request.user;

    // 3. Kiểm tra xem User có tồn tại và có Role hợp lệ không
    if (user && requiredRoles.includes(user.role)) {
      return true;
    }

    throw new ForbiddenException(
      'Sếp không có quyền truy cập vào khu vực này!',
    );
  }
}
