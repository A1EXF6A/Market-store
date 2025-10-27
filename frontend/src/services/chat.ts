import api from "./api";
import type { Chat, Message } from "@/types";

export interface CreateChatData {
  sellerId: number;
  buyerId: number;
}

export interface SendMessageData {
  chatId: number;
  content: string;
}

export const chatService = {
  getChats: async (): Promise<Chat[]> => {
    const response = await api.get("/chats/my-chats");
    return response.data;
  },

  getChatById: async (id: number): Promise<Chat> => {
    const response = await api.get(`/chats/${id}`);
    return response.data;
  },

  getChatMessages: async (chatId: number): Promise<Message[]> => {
    const response = await api.get(`/chats/${chatId}/messages`);
    return response.data;
  },

  createChat: async (data: CreateChatData): Promise<Chat> => {
    const response = await api.post("/chats", data);
    return response.data;
  },

  sendMessage: async (data: SendMessageData): Promise<Message> => {
    console.log(data);

    const response = await api.post("/chats/messages", data);
    return response.data;
  },

  findOrCreateChat: async (sellerId: number): Promise<Chat> => {
    const response = await api.post("/chats/find-or-create", { sellerId });
    return response.data;
  },
};

