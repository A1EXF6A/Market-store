import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  OneToMany,
} from "typeorm";
import { Item } from "./item.entity";
import { Chat } from "./chat.entity";
import { Message } from "./message.entity";
import { Rating } from "./rating.entity";
import { Report } from "./report.entity";
import { Appeal } from "./appeal.entity";
import { Incident } from "./incident.entity";
import { Favorite } from "./favorite.entity";

export enum UserRole {
  BUYER = "buyer",
  SELLER = "seller",
  MODERATOR = "moderator",
  ADMIN = "admin",
}

export enum UserGender {
  MALE = "male",
  FEMALE = "female",
  OTHER = "other",
}

export enum UserStatus {
  ACTIVE = "active",
  SUSPENDED = "suspended",
}

@Entity("users")
export class User {
  @PrimaryGeneratedColumn({ name: "user_id" })
  userId: number;

  @Column({ name: "national_id", type: "varchar", length: 20, unique: true })
  nationalId: string;

  @Column({ name: "first_name", type: "varchar", length: 100 })
  firstName: string;

  @Column({ name: "last_name", type: "varchar", length: 100 })
  lastName: string;

  @Column({ type: "varchar", length: 150, unique: true })
  email: string;

  @Column({ type: "varchar", length: 20, nullable: true })
  phone: string;

  @Column({ type: "text", nullable: true })
  address: string;

  @Column({ type: "enum", enum: UserGender, nullable: true })
  gender: UserGender;

  @Column({ type: "enum", enum: UserRole, default: UserRole.BUYER })
  role: UserRole;

  @Column({ type: "enum", enum: UserStatus, default: UserStatus.ACTIVE })
  status: UserStatus;

  @Column({ name: "password_hash", type: "text" })
  passwordHash: string;

  @Column({ type: "boolean", default: false })
  verified: boolean;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @OneToMany(() => Item, (item) => item.seller)
  items: Item[];

  @OneToMany(() => Chat, (chat) => chat.buyer)
  buyerChats: Chat[];

  @OneToMany(() => Chat, (chat) => chat.seller)
  sellerChats: Chat[];

  @OneToMany(() => Message, (message) => message.sender)
  messages: Message[];

  @OneToMany(() => Rating, (rating) => rating.seller)
  receivedRatings: Rating[];

  @OneToMany(() => Rating, (rating) => rating.buyer)
  givenRatings: Rating[];

  @OneToMany(() => Report, (report) => report.buyer)
  reports: Report[];

  @OneToMany(() => Appeal, (appeal) => appeal.seller)
  appeals: Appeal[];

  @OneToMany(() => Incident, (incident) => incident.moderator)
  moderatedIncidents: Incident[];

  @OneToMany(() => Incident, (incident) => incident.seller)
  sellerIncidents: Incident[];

  @OneToMany(() => Favorite, (favorite) => favorite.user)
  favorites: Favorite[];
}
