import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Item } from "./item.entity";

@Entity("item_photos")
export class ItemPhoto {
  @PrimaryGeneratedColumn({ name: "photo_id" })
  photoId: number;

  @Column({ name: "item_id", type: "int" })
  itemId: number;

  @Column({ type: "text" })
  url: string;

  @ManyToOne(() => Item, (item) => item.photos, { onDelete: "CASCADE" })
  @JoinColumn({ name: "item_id" })
  item: Item;
}
