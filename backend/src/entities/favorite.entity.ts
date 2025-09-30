import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
} from "typeorm";
import { Item } from "./item.entity";
import { User } from "./user.entity";

@Entity("favorites")
export class Favorite {
  @Column({ name: "user_id", primary: true, type: "int" })
  userId: number;

  @Column({ name: "item_id", primary: true, type: "int" })
  itemId: number;

  @CreateDateColumn({ name: "saved_at" })
  savedAt: Date;

  @ManyToOne(() => User, (user) => user.favorites, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user: User;

  @ManyToOne(() => Item, (item) => item.favorites, { onDelete: "CASCADE" })
  @JoinColumn({ name: "item_id" })
  item: Item;
}
