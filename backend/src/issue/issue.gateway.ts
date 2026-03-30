import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({ cors: { origin: '*' } })
export class IssueGateway {
  @WebSocketServer()
  server: Server;

  // Hàm này sẽ bắn tin nhắn mới đến tất cả những ai đang mở khung chat của issueId đó
  broadcastNewComment(issueId: string, comment: any) {
    this.server.emit(`new_comment_${issueId}`, comment);
  }
}
