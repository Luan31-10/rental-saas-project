import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Ép kiểu rõ ràng: request này có chứa thêm biến user (có thể rỗng)
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: any }>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException(
        'Vui lòng đăng nhập để sử dụng chức năng này!',
      );
    }

    try {
      // Ép kiểu cho payload: Báo cho TypeScript biết trong thẻ từ có chứa id, email, role
      const payload = await this.jwtService.verifyAsync<{
        id: string;
        email: string;
        role: string;
      }>(token, {
        secret: process.env.JWT_SECRET || 'SUPER_SECRET_KEY_SAAS',
      });

      // Gắn payload vào request.user một cách an toàn
      request.user = payload;
    } catch {
      throw new UnauthorizedException('Token không hợp lệ hoặc đã hết hạn!');
    }
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
