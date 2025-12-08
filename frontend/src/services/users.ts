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
  showDeleted?: boolean;
  search?: string;
}

export const usersService = {
  // =============================
  // LISTAR Y ADMINISTRAR USUARIOS
  // =============================

  getAll: async (filters?: UserFilters): Promise<User[]> => {
    const params = new URLSearchParams();
    if (filters?.role) params.append("role", filters.role);
    if (filters?.status) params.append("status", filters.status);
    if (filters?.showDeleted) params.append("showDeleted", String(filters.showDeleted));
    if (filters?.search) params.append("search", filters.search);

    const response = await api.get(`/users?${params.toString()}`);
    return response.data;
  },

  getById: async (id: number): Promise<User> => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  update: async (id: number, data: UpdateUserData): Promise<User> => {
    console.log("Updating user with data:", data);
    console.log("User ID:", id);
    const response = await api.patch(`/users/${id}`, data);
    return response.data;
  },
  updateMe: async (data: UpdateUserData): Promise<User> => {
    console.log("Updating current user with data:", data);
    const response = await api.patch(`/users/me`, data);
    return response.data;
  },


  suspend: async (id: number, suspendedUntil?: string | null): Promise<void> => {
    const payload: any = { status: "suspended" };
    if (suspendedUntil) payload.suspendedUntil = suspendedUntil;
    await api.patch(`/users/${id}/status`, payload);
  },

  unsuspend: async (id: number): Promise<void> => {
    await api.patch(`/users/${id}/status`, { status: "active" });
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/users/${id}`);
  },

  deleteAccount: async (id: number): Promise<void> => {
    await api.delete(`/users/${id}`);
  },

  changeRole: async (id: number, role: UserRole): Promise<User> => {
    const response = await api.patch(`/users/${id}/role`, { role });
    return response.data;
  },

  // =============================
  // PERFIL DEL USUARIO AUTENTICADO
  // =============================

  // 🔹 Editar perfil propio
  updateProfile: async (data: any): Promise<User> => {
    const response = await api.put("/users/profile", data);
    return response.data;
  },

  // 🔹 Cambiar rol propio (Vendedor <-> Comprador)
  switchMyRole: async (role: "buyer" | "seller"): Promise<User> => {
    const response = await api.patch("/users/me/role", { role });
    return response.data;
  },

  // 🔹 Cambiar contraseña propia (FALTABA)
  changePassword: async (data: {
    currentPassword: string;
    newPassword: string;
  }): Promise<User> => {
    const response = await api.patch("/users/change-password", data);
    return response.data;
  },
};
