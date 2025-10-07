import { Controller, Get, Post, Body, Param, UseGuards, Inject } from "@nestjs/common";
import { ChatService } from "./chat.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { GetUser } from "../common/decorators/get-user.decorator";
import { User } from "../entities/user.entity";

@Controller("chats")
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor( @Inject(ChatService) private readonly  chatService: ChatService) {}

  @Post("start")
  startChat(@Body("sellerId") sellerId: number, @GetUser() user: User) {
    return this.chatService.createOrGetChat(user.userId, sellerId);
  }
  @Post("find-or-create")
  findOrCreateChat(@Body("sellerId") sellerId: number, @GetUser() user: User) {
    return this.chatService.createOrGetChat(user.userId, sellerId);
  }

  @Get("my-chats")
  getMyChats(@GetUser() user: User) {
    console.log("User ID:", user.userId); 
    return this.chatService.getUserChats(user.userId);
  }

  @Get(":id/messages")
  getChatMessages(@Param("id") id: string,  @GetUser() user: User) {
    return this.chatService.getChatMessages(user,+id);
  }
  @Get(":id")
  getChatById(@Param("id") id: string,  @GetUser() user: User) {
    return this.chatService.getChatMessages(user,+id);
  }


  @Post("messages")
  sendMessage(
    @Body("chatId") id: string,
    @Body("content") content: string,
    @GetUser() user: User,
  ) {
    console.log("Creating message in chat:", id, "by user:", user.userId);
    return this.chatService.createMessage(+id, user.userId, content);
  }
}
