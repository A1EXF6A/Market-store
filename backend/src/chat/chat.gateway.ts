import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import {
  ClientToServerEvents,
  ServerToClientEvents,
  PayloadChat,
} from "./chat.events";

const SOCKET_EVENTS = {
  JOIN_CHAT: "join_chat",
  SEND_MESSAGE: "send_message",
  LEAVE_CHAT: "leave_chat",
};

@WebSocketGateway({
  cors: { origin: "*" },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server<ClientToServerEvents, ServerToClientEvents>;

  handleConnection(client: Socket) {
    console.log("Cliente conectado", client.id);
  }

  handleDisconnect(client: Socket) {
    console.log("Cliente desconectado", client.id);
  }

  @SubscribeMessage(SOCKET_EVENTS.JOIN_CHAT)
  handleJoinChat(
    @MessageBody() chatId: string,
    @ConnectedSocket()
    client: Socket<ClientToServerEvents, ServerToClientEvents>,
  ) {
    client.join(chatId); // se une a la "room"
    client.emit("joined_chat", chatId);
    console.log(`${client.id} se unió al chat ${chatId}`);
  }

  @SubscribeMessage(SOCKET_EVENTS.SEND_MESSAGE)
  handleSendMessage(
    @MessageBody()
    payload: PayloadChat,
  ) {
    // enviar solo a los usuarios en la misma room
    this.server.to(payload.chatId).emit("new_message", payload);
    console.log("Mensaje enviado al chat", payload.chatId);
  }

  @SubscribeMessage(SOCKET_EVENTS.LEAVE_CHAT)
  handleLeaveChat(
    @MessageBody() chatId: string,
    @ConnectedSocket()
    client: Socket<ClientToServerEvents, ServerToClientEvents>,
  ) {
    client.leave(chatId);
    client.emit("left_chat", chatId);
    console.log(`${client.id} salió del chat ${chatId}`);
    console.log("--------------------------------");
  }
}
