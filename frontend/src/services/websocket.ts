// src/services/websocket.ts
import { io, Socket } from "socket.io-client";
import type { Message } from "@/types";

type NewMessagePayload = Message & { sentAt: string; messageId?: number | string };

class WebSocketService {
  private socket: Socket | null = null;
  private url = "http://localhost:3000";

  // callbacks
  private _newMessageCallback?: (message: NewMessagePayload) => void;
  private _typingCallback?: (data: { userId: number | string; isTyping: boolean }) => void;
  private _connectCallback?: () => void;
  private _joinedChatCallback?: (chatId: number | string) => void;
  private _leftChatCallback?: (chatId: number | string) => void;

  connect(token: string): void {
    if (this.socket && this.socket.connected) return;

    this.socket = io(this.url, {
      auth: { token },
      autoConnect: true,
      reconnection: true,
    });

    this.socket.on("connect", () => {
      console.log("Socket conectado:", this.socket?.id);
      this._connectCallback?.();
    });

    this.socket.on("disconnect", (reason) => {
      console.log("Socket desconectado:", reason);
    });

    this.socket.on("connect_error", (err) => {
      console.error("Socket connect_error:", err);
    });

    // SERVER -> CLIENT (usar snake_case como en chat.events.ts)
    this.socket.on("new_message", (msg: NewMessagePayload) => {
      this._newMessageCallback?.(msg);
    });

    this.socket.on("user_typing", (data: { userId: number | string; isTyping: boolean }) => {
      this._typingCallback?.(data);
    });

    this.socket.on("joined_chat", (chatId: number | string) => {
      this._joinedChatCallback?.(chatId);
    });

    this.socket.on("left_chat", (chatId: number | string) => {
      this._leftChatCallback?.(chatId);
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // CLIENT -> SERVER
  joinChat(chatId: number): void {
    if (!this.socket) return;
    if (this.socket.connected) {
      this.socket.emit("join_chat", chatId);
    } else {
      // si aún no está conectado, esperar a connect
      this.socket.once("connect", () => {
        this.socket?.emit("join_chat", chatId);
      });
    }
  }

  leaveChat(chatId: number): void {
    if (!this.socket) return;
    if (this.socket.connected) {
      this.socket.emit("leave_chat", chatId);
    }
  }

  sendMessage( message: any): void {
    if (!this.socket) {
      console.error("Socket no inicializado - no se puede enviar mensaje");
      return;
    }
    // enviar con el nombre que espera el servidor
    this.socket.emit("send_message", message);
  }

  setTyping(chatId: number, isTyping: boolean): void {
    if (!this.socket) return;
    this.socket.emit("typing", { chatId, isTyping });
  }

  // register callbacks
  onNewMessage(callback: (message: NewMessagePayload) => void): void {
    this._newMessageCallback = callback;
  }

  onUserTyping(callback: (data: { userId: number | string; isTyping: boolean }) => void): void {
    this._typingCallback = callback;
  }

  onConnect(callback: () => void): void {
    this._connectCallback = callback;
  }

  onJoinedChat(callback: (chatId: number | string) => void): void {
    this._joinedChatCallback = callback;
  }

  onLeftChat(callback: (chatId: number | string) => void): void {
    this._leftChatCallback = callback;
  }

  // remove all listeners on socket
  offAll(): void {
    if (!this.socket) return;
    this.socket.off("new_message");
    this.socket.off("user_typing");
    this.socket.off("joined_chat");
    this.socket.off("left_chat");
    this.socket.off("connect");
    this.socket.off("disconnect");
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const socketService = new WebSocketService();
