// src/types/index.ts

/* ========= USER ========= */

export const UserRole = {
  BUYER: "buyer",
  SELLER: "seller",
  MODERATOR: "moderator",
  ADMIN: "admin",
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const UserStatus = {
  ACTIVE: "active",
  SUSPENDED: "suspended",
} as const;

export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];

export interface User {
  userId: number;
  nationalId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
  gender?: "male" | "female" | "other";
  role: UserRole;
  status: UserStatus;
  verified: boolean;
  createdAt: string;
}

/* ========= ITEMS / PRODUCTS ========= */

export const ItemType = {
  PRODUCT: "product",
  SERVICE: "service",
} as const;

export type ItemType = (typeof ItemType)[keyof typeof ItemType];

export const ItemStatus = {
  ACTIVE: "active",      // visible y aprobado
  SUSPENDED: "suspended", // suspendido por tiempo o admin
  HIDDEN: "hidden",      // oculto temporalmente
  PENDING: "pending",    // en revisión
  BANNED: "banned",      // prohibido / peligroso
} as const;

export type ItemStatus = (typeof ItemStatus)[keyof typeof ItemStatus];

export interface ItemPhoto {
  photoId: number;
  itemId: number;
  url: string;
}

export interface Service {
  serviceId: number;
  itemId: number;
  workingHours: string;
}

export interface Product {
  itemId: number;
  code: string;
  sellerId: number;
  type: ItemType;
  name: string;
  description?: string;
  category?: string;
  price?: number;
  location?: string;
  availability: boolean;
  status: ItemStatus;
  publishedAt: string;
  photos: ItemPhoto[];
  seller?: User;
  service?: Service;
}

/* ========= FAVORITOS ========= */

export interface Favorite {
  userId: number;
  itemId: number;
  savedAt: string;
}

/* ========= REPORTES ========= */

export const ReportType = {
  SPAM: "spam",
  INAPPROPRIATE: "inappropriate",
  ILLEGAL: "illegal",
  OTHER: "other",
} as const;

export type ReportType = (typeof ReportType)[keyof typeof ReportType];

export interface Report {
  reportId: number;
  itemId: number;
  buyerId: number;
  type: ReportType;
  comment?: string;
  reportedAt: string;

  // 🔹 Navegaciones opcionales que vienen del backend (getReports)
  item?: Product;
  buyer?: User;
}

/* ========= INCIDENTES ========= */
/**
 * ESTO ES LO NUEVO IMPORTANTE:
 * La incidencia tiene su propio estado (flujo de revisión),
 * distinto al estado del producto.
 */

export const IncidentStatus = {
  PENDING: "pending",
  REVIEWING: "reviewing",
  RESOLVED: "resolved",
  REJECTED: "rejected",
} as const;

export type IncidentStatus =
  (typeof IncidentStatus)[keyof typeof IncidentStatus];

export const IncidentType = {
  AUTO_DETECTED: "auto_detected",
  BUYER_REPORT: "buyer_report",
  MANUAL: "manual",
} as const;

export type IncidentType =
  (typeof IncidentType)[keyof typeof IncidentType];

export interface Appeal {
  appealId: number;
  incidentId: number;
  sellerId: number;
  reason: string;
  createdAt: string;
  reviewed: boolean;
}

export interface Incident {
  incidentId: number;
  itemId: number;
  reportedAt: string;
  status: IncidentStatus;   // ⬅️ ANTES era ItemStatus, ahora el estado de la incidencia
  type: IncidentType;       // ⬅️ tipo de incidencia (auto, reporte comprador, manual)
  description?: string;
  moderatorId?: number;
  sellerId?: number;
  item?: Product;
  moderator?: User;
  seller?: User;
  appeals?: Appeal[];
}

/* ========= CHAT / MENSAJES ========= */

export interface Chat {
  chatId: number;
  buyerId: number;
  sellerId: number;
  startedAt: string;
  buyer?: User;
  seller?: User;
  messages?: Message[];
}

export interface Message {
  messageId: number;
  chatId: number;
  senderId: number;
  content: string;
  sentAt: string;
  sender?: User;
}

/* ========= RATING ========= */

export interface Rating {
  ratingId: number;
  sellerId: number;
  buyerId: number;
  score: number;
  comment?: string;
  createdAt: string;
}

/* ========= AUTH ========= */

export interface AuthResponse {
  access_token: string;
  user: User;
}

/* ========= FILTROS ========= */

export interface ProductFilters {
  type?: ItemType;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  location?: string;
  search?: string;
}
