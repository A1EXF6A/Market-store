import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Chat } from "./chat.entity";
import { User } from "./user.entity";

@Entity("messages")
export class Message {
  @PrimaryGeneratedColumn({ name: "message_id" })
  messageId: number;

  @Column({ name: "chat_id", type: "int" })
  chatId: number;

  @Column({ name: "sender_id", type: "int" })
  senderId: number;

  @Column({ type: "text" })
  content: string;

  @CreateDateColumn({ name: "sent_at" })
  sentAt: Date;

  @ManyToOne(() => Chat, (chat) => chat.messages, { onDelete: "CASCADE" })
  @JoinColumn({ name: "chat_id" })
  chat: Chat;

  @ManyToOne(() => User, (user) => user.messages, { onDelete: "CASCADE" })
  @JoinColumn({ name: "sender_id" })
  sender: User;
}
