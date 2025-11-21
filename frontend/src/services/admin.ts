// src/services/admin.ts
import { api } from "./api"; // 👈 tu instancia de axios con baseURL y auth

export type CreateModeratorPayload = {
  firstName: string;
  lastName: string;
  email: string;
  nationalId?: string;
  password: string;
};

export type AdminUser = {
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
  role: "buyer" | "seller" | "moderator" | "admin" | string;
  status: "active" | "inactive" | "banned" | "suspended" | string;
  verified: boolean;
  createdAt: string;
};

export const adminService = {
  getAllUsers: async (): Promise<AdminUser[]> => {
    const { data } = await api.get("/admin/users");
    return data;
  },

  toggleUserStatus: async (userId: number) => {
    const { data } = await api.patch(`/admin/toggle-status/${userId}`);
    return data;
  },

  createModerator: async (payload: CreateModeratorPayload) => {
    const { data } = await api.post("/admin/create-moderator", payload);
    return data; // { message: 'Moderator created successfully' }
  },
};
