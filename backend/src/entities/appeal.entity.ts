import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Incident } from "./incident.entity";
import { User } from "./user.entity";

@Entity("appeals")
export class Appeal {
  @PrimaryGeneratedColumn({ name: "appeal_id" })
  appealId: number;

  @Column({ name: "incident_id", type: "int" })
  incidentId: number;

  @Column({ name: "seller_id", type: "int" })
  sellerId: number;

  @Column({ type: "text" })
  reason: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @Column({ type: "boolean", default: false })
  reviewed: boolean;

  @ManyToOne(() => Incident, (incident) => incident.appeals, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "incident_id" })
  incident: Incident;

  @ManyToOne(() => User, (user) => user.appeals, { onDelete: "CASCADE" })
  @JoinColumn({ name: "seller_id" })
  seller: User;
}
