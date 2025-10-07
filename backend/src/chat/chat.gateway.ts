import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: { origin: '*' },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log('Cliente conectado', client.id);
  }

  handleDisconnect(client: Socket) {
    console.log('Cliente desconectado', client.id);
  }

  @SubscribeMessage('join-chat')
  handleJoinChat(
    @MessageBody() chatId: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.join(chatId); // se une a la "room"
    client.emit('joined-chat', chatId);
    console.log(`${client.id} se unió al chat ${chatId}`);
  }

  @SubscribeMessage('send-message')
  handleSendMessage(
    @MessageBody() payload: { chatId: string; senderId: number; content: string },
  ) {
    // enviar solo a los usuarios en la misma room
    this.server.to(payload.chatId).emit('new-message', payload);
    console.log('Mensaje enviado al chat', payload.chatId);
  }

  @SubscribeMessage('leave-chat')
  handleLeaveChat(
    @MessageBody() chatId: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.leave(chatId);
    client.emit('left-chat', chatId);
    console.log(`${client.id} salió del chat ${chatId}`);
  }
}
