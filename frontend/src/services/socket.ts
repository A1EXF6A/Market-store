import { io, Socket } from 'socket.io-client';
import type { Message } from '../types';

class SocketService {
  private socket: Socket | null = null;
  private url = 'http://localhost:3000'; // Adjust this to your backend URL

  connect(token: string): void {
    if (this.socket?.connected) return;

    this.socket = io(this.url, {
      auth: {
        token,
      },
      transports: ['websocket', 'polling'],
    });

    this.socket.on('connect', () => {
      console.log('Connected to chat server');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from chat server');
    });

    this.socket.on('error', (error: any) => {
      console.error('Socket error:', error);
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinChat(chatId: number): void {
    if (this.socket) {
      this.socket.emit('join-chat', chatId);
    }
  }

  leaveChat(chatId: number): void {
    if (this.socket) {
      this.socket.emit('leave-chat', chatId);
    }
  }

  sendMessage(chatId: number, content: string): void {
    if (this.socket) {
      this.socket.emit('send-message', { chatId, content });
    }
  }

  onNewMessage(callback: (message: Message) => void): void {
    if (this.socket) {
      this.socket.on('new-message', callback);
    }
  }

  onUserTyping(callback: (data: { userId: number; isTyping: boolean }) => void): void {
    if (this.socket) {
      this.socket.on('user-typing', callback);
    }
  }

  setTyping(chatId: number, isTyping: boolean): void {
    if (this.socket) {
      this.socket.emit('typing', { chatId, isTyping });
    }
  }

  off(event: string): void {
    if (this.socket) {
      this.socket.off(event);
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const socketService = new SocketService();