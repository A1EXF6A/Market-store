// Ajusta según tus importaciones / estructura si necesitas exportar tipos extras.
// Este archivo define los nombres y shapes de los eventos entre cliente <-> servidor.

export type PayloadChat = {
  chatId: number;
  content: string;
  senderId?: number;
  // no ponemos `sentAt` aquí porque lo genera el servidor, pero el ServerToClientEvents
  // usará una versión que sí incluye sentAt cuando emite.
};

export interface ClientToServerEvents {
  // eventos que el cliente emite al servidor
  join_chat: (chatId: number | string) => void;
  send_message: (payload: { chatId: number; content: string }) => void;
  leave_chat: (chatId: number | string) => void;
  typing: (payload: { chatId: number; isTyping: boolean }) => void;
}

export interface ServerToClientEvents {
  // eventos que el servidor emite al cliente
  // permitimos number | string para chatId (evita error al usar number)
  joined_chat: (chatId: number | string) => void;
  left_chat: (chatId: number | string) => void;

  // new_message incluye la info del payload + sentAt que genera el servidor
  new_message: (payload: PayloadChat & { sentAt: string; messageId?: number | string }) => void;

  // indicador de escritura enviado a los clientes (excluye emisor)
  user_typing: (data: { userId: number | string; isTyping: boolean }) => void;
}
