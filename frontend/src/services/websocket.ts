import { io, Socket } from "socket.io-client";
import type { Message } from "@/types";

class WebSocketService {
  private socket: Socket | null = null;
  private url = "http://localhost:3000";

  connect(token: string): void {
    if (this.socket?.connected) return;

    this.socket = io(this.url, {
      auth: { token },
      autoConnect: true,
    });

    this.socket.on("connect", () => {});

    this.socket.on("disconnect", () => {});

    this.socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
    });

    // Eventos del servidor
    this.socket.on("new-message", (msg: Message) =>
      this._newMessageCallback?.(msg),
    );
    this.socket.on(
      "user-typing",
      (data: { userId: number; isTyping: boolean }) =>
        this._typingCallback?.(data),
    );
    this.socket.on("joined-chat", (chatId: string) => {});
    this.socket.on("left-chat", (chatId: string) => {});
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinChat(chatId: number): void {
    if (this.socket?.connected) {
      this.socket.emit("join-chat", chatId);
    }
  }

  leaveChat(chatId: number): void {
    if (this.socket?.connected) {
      this.socket.emit("leave-chat", chatId);
    }
  }

  sendMessage(chatId: number, content: string): void {
    if (this.socket?.connected) {
      this.socket.emit("send-message", { chatId, content });
    }
  }

  private _newMessageCallback?: (message: Message) => void;
  private _typingCallback?: (data: {
    userId: number;
    isTyping: boolean;
  }) => void;

  onNewMessage(callback: (message: Message) => void): void {
    this._newMessageCallback = callback;
  }

  onUserTyping(
    callback: (data: { userId: number; isTyping: boolean }) => void,
  ): void {
    this._typingCallback = callback;
  }

  setTyping(chatId: number, isTyping: boolean): void {
    if (this.socket?.connected) {
      this.socket.emit("typing", { chatId, isTyping });
    }
  }

  off(event: string): void {
    if (!this.socket) return;
    if (event === "new-message") this.socket.off("new-message");
    if (event === "user-typing") this.socket.off("user-typing");
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const socketService = new WebSocketService();
