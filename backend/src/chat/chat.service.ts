import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Chat } from "../entities/chat.entity";
import { Message } from "../entities/message.entity";
import { User } from "../entities/user.entity";

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Chat)
    private chatRepository: Repository<Chat>,
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
  ) {}

  async createOrGetChat(buyerId: number, sellerId: number): Promise<Chat> {
    let chat = await this.chatRepository.findOne({
      where: { buyerId, sellerId },
      relations: ["buyer", "seller"],
    });

    if (!chat) {
      chat = this.chatRepository.create({ buyerId, sellerId });
      chat = await this.chatRepository.save(chat);
      chat = await this.chatRepository.findOne({
        where: { chatId: chat.chatId },
        relations: ["buyer", "seller"],
      });
    }

    return chat;
  }

  async getUserChats(userId: number): Promise<Chat[]> {
    return this.chatRepository.find({
      where: [{ buyerId: userId }, { sellerId: userId }],
      relations: ["buyer", "seller", "messages"],
      order: { startedAt: "DESC" },
    });
  }

  async getChatMessages(user: User, chatId: number): Promise<Message[]> {
    //si el chat no le pertenece al usuario, lanzar error
    const chat = await this.chatRepository.findOne({
      where: { chatId },
      relations: ["buyer", "seller"],
    });
    if (
      !chat ||
      (chat.buyer.userId !== user.userId && chat.seller.userId !== user.userId)
    ) {
      throw new Error("Access denied");
    }

    return this.messageRepository.find({
      where: { chatId },
      relations: ["sender"],
      order: { sentAt: "ASC" },
    });
  }

  async getChatById(chatId: number): Promise<Chat> {
    return this.chatRepository.findOne({
      where: { chatId },
      relations: ["buyer", "seller"],
    });
  }

  async createMessage(
    chatId: number,
    senderId: number,
    content: string,
  ): Promise<Message> {
    const message = this.messageRepository.create({
      chatId,
      senderId,
      content,
    });

    return this.messageRepository.save(message);
  }
}
