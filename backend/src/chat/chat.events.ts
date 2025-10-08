interface PayloadChat {
  chatId: string;
  senderId: number;
  content: string;
}

interface ClientToServerEvents {
  join_chat: (chat: string) => void;
  send_message: (payload: PayloadChat) => void;
  leave_chat: (chatId: string) => void;
}

interface ServerToClientEvents {
  joined_chat: (chatId: string) => void;
  new_message: (payload: PayloadChat) => void;
  left_chat: (chatId: string) => void;
}

export { ClientToServerEvents, ServerToClientEvents, PayloadChat };
