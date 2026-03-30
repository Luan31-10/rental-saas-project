import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({ cors: { origin: '*' } }) // Cho phép Frontend kết nối thoải mái
export class TenantGateway {
  @WebSocketServer()
  server: Server;

  // Hàm này sẽ dùng để "báo mộng" cho khách thuê dựa vào email của họ
  notifyRoomUpdate(email: string) {
    if (email) {
      // Bắn một sự kiện mang tên chính email của khách đó
      this.server.emit(`room_updated_${email}`, {
        message: 'Sếp có cập nhật phòng mới!',
      });
    }
  }
}
