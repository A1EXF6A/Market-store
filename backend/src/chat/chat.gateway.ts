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

/**
 * Usamos snake_case en todos los nombres de eventos para que coincida con
 * las firmas TypeScript (ServerToClientEvents / ClientToServerEvents).
 *
 * Asegúrate de que ./chat.events.ts tenga exactamente los mismos nombres.
 */
const SOCKET_EVENTS = {
  JOIN_CHAT: "join_chat",      // cliente -> servidor
  SEND_MESSAGE: "send_message",// cliente -> servidor
  LEAVE_CHAT: "leave_chat",    // cliente -> servidor
  TYPING: "typing",            // cliente -> servidor (si tus tipos lo nombran distinto, ajústalo)
};

@WebSocketGateway({
  cors: { origin: "*" },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server<ClientToServerEvents, ServerToClientEvents>;

  handleConnection(client: Socket) {
    console.log("Cliente conectado:", client.id);
  }

  handleDisconnect(client: Socket) {
    console.log("Cliente desconectado:", client.id);
  }

  // --- JOIN CHAT ---
  @SubscribeMessage(SOCKET_EVENTS.JOIN_CHAT)
  handleJoinChat(
    @MessageBody() chatId: number,
    @ConnectedSocket() client: Socket<ClientToServerEvents, ServerToClientEvents>,
  ) {
    const room = `chat_${chatId}`;
    client.join(room);

    // -- usar el evento tipado "joined_chat"
    client.emit("joined_chat", chatId);
    console.log(`${client.id} se unió a la sala ${room}`);
  }

  // --- LEAVE CHAT ---
  @SubscribeMessage(SOCKET_EVENTS.LEAVE_CHAT)
  handleLeaveChat(
    @MessageBody() chatId: number,
    @ConnectedSocket() client: Socket<ClientToServerEvents, ServerToClientEvents>,
  ) {
    const room = `chat_${chatId}`;
    client.leave(room);

    // -- usar "left_chat"
    client.emit("left_chat", chatId);
    console.log(`${client.id} salió de la sala ${room}`);
    console.log("--------------------------------");
  }

  // --- SEND MESSAGE ---
  @SubscribeMessage(SOCKET_EVENTS.SEND_MESSAGE)
  handleSendMessage(
    @MessageBody() payload: PayloadChat,
    @ConnectedSocket() client: Socket<ClientToServerEvents, ServerToClientEvents>,
  ) {
    const room = `chat_${payload.chatId}`;

    // -- emitir "new_message" (snake_case)
    this.server.to(room).emit("new_message", {
      ...payload,
      sentAt: new Date().toISOString(),
    });

    console.log(`Mensaje enviado a ${room}:`, payload.content);
  }

  // --- TYPING INDICATOR ---
  @SubscribeMessage(SOCKET_EVENTS.TYPING)
  handleTyping(
    @MessageBody() payload: { chatId: number; isTyping: boolean },
    @ConnectedSocket() client: Socket<ClientToServerEvents, ServerToClientEvents>,
  ) {
    const room = `chat_${payload.chatId}`;

    // reenviar a los demás en la sala (excluye al emisor)
    // -- usar "user_typing" si ese es el nombre tipado en tus ServerToClientEvents
    client.broadcast.to(room).emit("user_typing", {
      userId: (client as any).userId || client.id,
      isTyping: payload.isTyping,
    });

    console.log(
      `Usuario ${client.id} typing=${payload.isTyping} en ${room}`,
    );
  }
}
