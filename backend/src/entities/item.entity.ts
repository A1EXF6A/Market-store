import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  JoinColumn,
} from "typeorm";
import { User } from "./user.entity";
import { ItemPhoto } from "./item-photo.entity";
import { Service } from "./service.entity";
import { Favorite } from "./favorite.entity";
import { Report } from "./report.entity";
import { Incident } from "./incident.entity";
import { ItemStatus, ItemType } from "./enums";

@Entity("items")
export class Item {
  @PrimaryGeneratedColumn({ name: "item_id" })
  itemId: number;

  @Column({ type: "varchar", length: 50, unique: true })
  code: string;

  @Column({ name: "seller_id", type: "int" })
  sellerId: number;

  @Column({ type: "enum", enum: ItemType })
  type: ItemType;

  @Column({ type: "varchar", length: 200 })
  name: string;

  @Column({ type: "text", nullable: true })
  description: string;

  @Column({ type: "numeric", precision: 12, scale: 2, nullable: true })
  price: number;

  @Column({ type: "varchar", length: 150, nullable: true })
  location: string;

  @Column({ type: "boolean", default: true })
  availability: boolean;

  @Column({ type: "enum", enum: ItemStatus, default: ItemStatus.ACTIVE })
  status: ItemStatus;

  @CreateDateColumn({ name: "published_at" })
  publishedAt: Date;

  @ManyToOne(() => User, (user) => user.items, { onDelete: "CASCADE" })
  @JoinColumn({ name: "seller_id" })
  seller: User;

  @OneToMany(() => ItemPhoto, (photo) => photo.item, { cascade: true })
  photos: ItemPhoto[];

  @OneToOne(() => Service, (service) => service.item, { cascade: true })
  service: Service;

  @OneToMany(() => Favorite, (favorite) => favorite.item)
  favorites: Favorite[];

  @OneToMany(() => Report, (report) => report.item)
  reports: Report[];

  @OneToMany(() => Incident, (incident) => incident.item)
  incidents: Incident[];
}

export { ItemStatus };
