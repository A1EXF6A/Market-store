import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Item } from "./item.entity";
import { User } from "./user.entity";

export enum ReportType {
  SPAM = "spam",
  INAPPROPRIATE = "inappropriate",
  ILLEGAL = "illegal",
  OTHER = "other",
}

@Entity("reports")
export class Report {
  @PrimaryGeneratedColumn({ name: "report_id" })
  reportId: number;

  @Column({ name: "item_id", type: "int" })
  itemId: number;

  @Column({ name: "buyer_id", type: "int" })
  buyerId: number;

  @Column({ type: "enum", enum: ReportType })
  type: ReportType;

  @Column({ type: "text", nullable: true })
  comment: string;

  @CreateDateColumn({ name: "reported_at" })
  reportedAt: Date;

  @ManyToOne(() => Item, (item) => item.reports, { onDelete: "CASCADE" })
  @JoinColumn({ name: "item_id" })
  item: Item;

  @ManyToOne(() => User, (user) => user.reports, { onDelete: "CASCADE" })
  @JoinColumn({ name: "buyer_id" })
  buyer: User;
}
