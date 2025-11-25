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

<<<<<<< HEAD
  // 👇 AHORA usa IncidentStatus, no ItemStatus
  @Column({ type: "enum", enum: IncidentStatus, default: IncidentStatus.PENDING })
  status: IncidentStatus;

  // Tipo de incidente (auto detectado, reporte comprador, manual…)
  @Column({ type: "enum", enum: IncidentType, default: IncidentType.AUTO_DETECTED })
  type: IncidentType;
=======
  @Column({
    type: "enum",
    enum: ItemStatus,
    default: ItemStatus.PENDING,
  })
  status: ItemStatus;
>>>>>>> 0cda334 (Cambios antes de pasar a rama cambios)

  @Column({ type: "text", nullable: true })
  description?: string | null;

  @Column({ name: "moderator_id", nullable: true, type: "int" })
<<<<<<< HEAD
  moderatorId: number | null;

  @Column({ name: "seller_id", nullable: true, type: "int" })
  sellerId: number | null;

  @Column({ name: "resolved_at", type: "timestamp", nullable: true })
  resolvedAt: Date | null;

  /* ========= Relaciones ========= */
=======
  moderatorId?: number | null;

  @Column({ name: "seller_id", nullable: true, type: "int" })
  sellerId?: number | null;
>>>>>>> 0cda334 (Cambios antes de pasar a rama cambios)

  // ✅ Producto asociado
  @ManyToOne(() => Item, (item) => item.incidents, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "item_id" })
  item: Item;

<<<<<<< HEAD
  @ManyToOne(() => User, (user) => user.moderatedIncidents, { nullable: true })
=======
  // ✅ Moderador puede ser null sin romper joins
  @ManyToOne(() => User, (user) => user.moderatedIncidents, {
    nullable: true,
    onDelete: "SET NULL",
  })
>>>>>>> 0cda334 (Cambios antes de pasar a rama cambios)
  @JoinColumn({ name: "moderator_id" })
  moderator?: User | null;

<<<<<<< HEAD
  @ManyToOne(() => User, (user) => user.sellerIncidents, { nullable: true })
=======
  // ✅ Vendedor asociado (si borras vendedor, se borran incidentes)
  @ManyToOne(() => User, (user) => user.sellerIncidents, {
    nullable: true,
    onDelete: "CASCADE",
  })
>>>>>>> 0cda334 (Cambios antes de pasar a rama cambios)
  @JoinColumn({ name: "seller_id" })
  seller?: User | null;

  // ✅ Apelaciones ligadas a esta incidencia
  @OneToMany(() => Appeal, (appeal) => appeal.incident)
  appeals: Appeal[];

  // ✅ Fecha de resolución
  @Column({ name: "resolved_at", type: "timestamp", nullable: true })
  resolvedAt?: Date | null;
}
