import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ChatService } from "./chat.service";
import { ChatController } from "./chat.controller";
import { Chat } from "../entities/chat.entity";
import { Message } from "../entities/message.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Chat, Message])],
  controllers: [ChatController],
  providers: [ChatService],
  exports: [ChatService],
})
export class ChatModule {}
