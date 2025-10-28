export interface User {
  userId: number;
  nationalId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
  gender?: 'male' | 'female' | 'other';
  role: UserRole;
  status: UserStatus;
  verified: boolean;
  createdAt: string;
}

export const UserRole = {
  BUYER: 'buyer',
  SELLER: 'seller',
  MODERATOR: 'moderator',
  ADMIN: 'admin'
} as const;

export type UserRole = typeof UserRole[keyof typeof UserRole];

export const UserStatus = {
  ACTIVE: 'active',
  SUSPENDED: 'suspended'
} as const;

export type UserStatus = typeof UserStatus[keyof typeof UserStatus];

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
  latitude?: number;
  longitude?: number;
  availability: boolean;
  status: ItemStatus;
  publishedAt: string;
  photos: ItemPhoto[];
  seller?: User;
  service?: Service;
}

export const ItemType = {
  PRODUCT: 'product',
  SERVICE: 'service'
} as const;

export type ItemType = typeof ItemType[keyof typeof ItemType];

export const ItemStatus = {
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  HIDDEN: 'hidden',
  PENDING: 'pending',
  BANNED: 'banned'
} as const;

export type ItemStatus = typeof ItemStatus[keyof typeof ItemStatus];

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

export interface Favorite {
  userId: number;
  itemId: number;
  savedAt: string;
}

export interface Report {
  reportId: number;
  itemId: number;
  buyerId: number;
  type: ReportType;
  comment?: string;
  reportedAt: string;
}

export const ReportType = {
  SPAM: 'spam',
  INAPPROPRIATE: 'inappropriate',
  ILLEGAL: 'illegal',
  OTHER: 'other'
} as const;

export type ReportType = typeof ReportType[keyof typeof ReportType];

export interface Incident {
  incidentId: number;
  itemId: number;
  reportedAt: string;
  status: ItemStatus;
  description?: string;
  moderatorId?: number;
  sellerId?: number;
  item?: Product;
  moderator?: User;
  seller?: User;
  appeals?: Appeal[];
}

export interface Appeal {
  appealId: number;
  incidentId: number;
  sellerId: number;
  reason: string;
  createdAt: string;
  reviewed: boolean;
}

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

export interface Rating {
  ratingId: number;
  sellerId: number;
  buyerId: number;
  score: number;
  comment?: string;
  createdAt: string;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

export interface ProductFilters {
  type?: ItemType;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  location?: string;
  search?: string;
  status?: ItemStatus;
}