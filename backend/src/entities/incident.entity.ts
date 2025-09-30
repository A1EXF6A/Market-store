import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from "typeorm";
import { Item } from "./item.entity";
import { User } from "./user.entity";
import { Appeal } from "./appeal.entity";
import { ItemStatus } from "./enums";

@Entity("incidents")
export class Incident {
  @PrimaryGeneratedColumn({ name: "incident_id" })
  incidentId: number;

  @Column({ name: "item_id", type: "int" })
  itemId: number;

  @CreateDateColumn({ name: "reported_at" })
  reportedAt: Date;

  @Column({ type: "enum", enum: ItemStatus })
  status: ItemStatus;

  @Column({ type: "text", nullable: true })
  description: string;

  @Column({ name: "moderator_id", nullable: true, type: "int" })
  moderatorId: number;

  @Column({ name: "seller_id", nullable: true, type: "int" })
  sellerId: number;

  @ManyToOne(() => Item, (item) => item.incidents, { onDelete: "CASCADE" })
  @JoinColumn({ name: "item_id" })
  item: Item;

  @ManyToOne(() => User, (user) => user.moderatedIncidents)
  @JoinColumn({ name: "moderator_id" })
  moderator: User;

  @ManyToOne(() => User, (user) => user.sellerIncidents)
  @JoinColumn({ name: "seller_id" })
  seller: User;

  @OneToMany(() => Appeal, (appeal) => appeal.incident)
  appeals: Appeal[];
}
