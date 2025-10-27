import api from "./api";
import type { User } from "@/types";
import { UserRole, UserStatus } from "@/types";

export interface UpdateUserData {
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: UserRole;
  status?: UserStatus;
}

export interface UserFilters {
  role?: UserRole;
  status?: UserStatus;
  search?: string;
}

export const usersService = {
  getAll: async (filters?: UserFilters): Promise<User[]> => {
    const params = new URLSearchParams();
    if (filters?.role) params.append("role", filters.role);
    if (filters?.status) params.append("status", filters.status);
    if (filters?.search) params.append("search", filters.search);

    const response = await api.get(`/users?${params.toString()}`);
    return response.data;
  },

  getById: async (id: number): Promise<User> => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  update: async (id: number, data: UpdateUserData): Promise<User> => {
    const response = await api.patch(`/users/${id}`, data);
    return response.data;
  },

  suspend: async (id: number): Promise<void> => {
    await api.patch(`/users/${id}/status`, { status: "suspended" });
  },

  unsuspend: async (id: number): Promise<void> => {
    await api.patch(`/users/${id}/status`, { status: "active" });
  },

  suspendWithUntil: async (id: number, suspendedUntil?: string): Promise<void> => {
    const body: any = { status: "suspended" };
    if (suspendedUntil) body.suspendedUntil = suspendedUntil;
    await api.patch(`/users/${id}/status`, body);
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/users/${id}`);
  },

  changeRole: async (id: number, role: UserRole): Promise<User> => {
    const response = await api.patch(`/users/${id}/role`, { role });
    return response.data;
  },
};

