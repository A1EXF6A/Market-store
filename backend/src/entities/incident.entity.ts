// src/entities/incident.entity.ts
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
import { ItemStatus, IncidentStatus, IncidentType } from "./enums";

@Entity("incidents")
export class Incident {
  @PrimaryGeneratedColumn({ name: "incident_id" })
  incidentId: number;

  @Column({ name: "item_id", type: "int" })
  itemId: number;

  @CreateDateColumn({ name: "reported_at" })
  reportedAt: Date;

  // 👇 AHORA usa IncidentStatus, no ItemStatus
  @Column({ type: "enum", enum: IncidentStatus, default: IncidentStatus.PENDING })
  status: IncidentStatus;

  // Tipo de incidente (auto detectado, reporte comprador, manual…)
  @Column({ type: "enum", enum: IncidentType, default: IncidentType.AUTO_DETECTED })
  type: IncidentType;

  @Column({ type: "text", nullable: true })
  description: string;

  @Column({ name: "moderator_id", nullable: true, type: "int" })
  moderatorId: number | null;

  @Column({ name: "seller_id", nullable: true, type: "int" })
  sellerId: number | null;

  @Column({ name: "resolved_at", type: "timestamp", nullable: true })
  resolvedAt: Date | null;

  /* ========= Relaciones ========= */

  @ManyToOne(() => Item, (item) => item.incidents, { onDelete: "CASCADE" })
  @JoinColumn({ name: "item_id" })
  item: Item;

  @ManyToOne(() => User, (user) => user.moderatedIncidents, { nullable: true })
  @JoinColumn({ name: "moderator_id" })
  moderator: User;

  @ManyToOne(() => User, (user) => user.sellerIncidents, { nullable: true })
  @JoinColumn({ name: "seller_id" })
  seller: User;

  @OneToMany(() => Appeal, (appeal) => appeal.incident)
  appeals: Appeal[];
}
