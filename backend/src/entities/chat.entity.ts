import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from "typeorm";
import { User } from "./user.entity";
import { Message } from "./message.entity";

@Entity("chats")
export class Chat {
  @PrimaryGeneratedColumn({ name: "chat_id" })
  chatId: number;

  @Column({ name: "buyer_id", type: "int" })
  buyerId: number;

  @Column({ name: "seller_id", type: "int" })
  sellerId: number;

  @CreateDateColumn({ name: "started_at" })
  startedAt: Date;

  @ManyToOne(() => User, (user) => user.buyerChats, { onDelete: "CASCADE" })
  @JoinColumn({ name: "buyer_id" })
  buyer: User;

  @ManyToOne(() => User, (user) => user.sellerChats, { onDelete: "CASCADE" })
  @JoinColumn({ name: "seller_id" })
  seller: User;

  @OneToMany(() => Message, (message) => message.chat)
  messages: Message[];
}
