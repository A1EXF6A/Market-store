import { Controller, Get, Post, Body, Param, UseGuards } from "@nestjs/common";
import { ChatService } from "./chat.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { GetUser } from "../common/decorators/get-user.decorator";
import { User } from "../entities/user.entity";

@Controller("chat")
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post("start")
  startChat(@Body("sellerId") sellerId: number, @GetUser() user: User) {
    return this.chatService.createOrGetChat(user.userId, sellerId);
  }

  @Get("my-chats")
  getMyChats(@GetUser() user: User) {
    return this.chatService.getUserChats(user.userId);
  }

  @Get(":id/messages")
  getChatMessages(@Param("id") id: string) {
    return this.chatService.getChatMessages(+id);
  }

  @Post(":id/messages")
  sendMessage(
    @Param("id") id: string,
    @Body("content") content: string,
    @GetUser() user: User,
  ) {
    return this.chatService.createMessage(+id, user.userId, content);
  }
}
