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

  @Column({
    type: "enum",
    enum: ItemStatus,
    default: ItemStatus.PENDING,
  })
  status: ItemStatus;

  @Column({ type: "text", nullable: true })
  description?: string | null;

  @Column({ name: "moderator_id", nullable: true, type: "int" })
  moderatorId?: number | null;

  @Column({ name: "seller_id", nullable: true, type: "int" })
  sellerId?: number | null;

  // ✅ Producto asociado
  @ManyToOne(() => Item, (item) => item.incidents, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "item_id" })
  item: Item;

  // ✅ Moderador puede ser null sin romper joins
  @ManyToOne(() => User, (user) => user.moderatedIncidents, {
    nullable: true,
    onDelete: "SET NULL",
  })
  @JoinColumn({ name: "moderator_id" })
  moderator?: User | null;

  // ✅ Vendedor asociado (si borras vendedor, se borran incidentes)
  @ManyToOne(() => User, (user) => user.sellerIncidents, {
    nullable: true,
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "seller_id" })
  seller?: User | null;

  // ✅ Apelaciones ligadas a esta incidencia
  @OneToMany(() => Appeal, (appeal) => appeal.incident)
  appeals: Appeal[];

  // ✅ Fecha de resolución
  @Column({ name: "resolved_at", type: "timestamp", nullable: true })
  resolvedAt?: Date | null;
}
