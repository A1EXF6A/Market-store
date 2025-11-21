export enum ItemType {
  PRODUCT = "product",
  SERVICE = "service",
}

export enum ItemStatus {
  ACTIVE = "active",     // visible
  PENDING = "pending",   // en revisión
  BANNED = "banned",     // prohibido / bloqueado
  HIDDEN = "hidden",     // oculto temporalmente
  SOLD = "sold",         // vendido
}

export enum IncidentStatus {
  PENDING = "pending",
  REVIEWING = "reviewing",
  RESOLVED = "resolved",
  REJECTED = "rejected",
}

export enum IncidentType {
  AUTO_DETECTED = "auto_detected",
  BUYER_REPORT = "buyer_report",
  MANUAL = "manual",
}
