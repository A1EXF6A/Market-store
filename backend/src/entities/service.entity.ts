import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToOne,
  JoinColumn,
} from "typeorm";
import { Item } from "./item.entity";

@Entity("services")
export class Service {
  @PrimaryGeneratedColumn({ name: "service_id" })
  serviceId: number;

  @Column({ name: "item_id", unique: true, type: "int" })
  itemId: number;

  @Column({ name: "working_hours", type: "text" })
  workingHours: string;

  @OneToOne(() => Item, (item) => item.service, { onDelete: "CASCADE" })
  @JoinColumn({ name: "item_id" })
  item: Item;
}
