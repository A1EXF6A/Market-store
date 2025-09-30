import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { User } from "./user.entity";

@Entity("ratings")
export class Rating {
  @PrimaryGeneratedColumn({ name: "rating_id" })
  ratingId: number;

  @Column({ name: "seller_id", type: "int" })
  sellerId: number;

  @Column({ name: "buyer_id", type: "int" })
  buyerId: number;

  @Column({ type: "int" })
  score: number;

  @Column({ type: "text", nullable: true })
  comment: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.receivedRatings, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "seller_id" })
  seller: User;

  @ManyToOne(() => User, (user) => user.givenRatings, { onDelete: "CASCADE" })
  @JoinColumn({ name: "buyer_id" })
  buyer: User;
}
