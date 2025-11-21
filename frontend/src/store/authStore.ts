import { create } from "zustand";
import { persist } from "zustand/middleware";
import { authService } from "@services/auth";
import type { User } from "@/types";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<any>;
  logout: () => void;
  initializeAuth: () => Promise<void>;
  getToken: () => string | undefined;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      // =========================
      // LOGIN
      // =========================
      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          const response = await authService.login({ email, password });

          // ✅ Guardar token y usuario
          localStorage.setItem("access_token", response.access_token);
          localStorage.setItem("user", JSON.stringify(response.user));

          set({
            user: response.user,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (err: any) {
          set({ isLoading: false });
          // 🚫 No uses toast ni navigate aquí
          throw err; // Deja que la page maneje el error (por ejemplo EMAIL_NOT_VERIFIED)
        }
      },

      // =========================
      // REGISTER (ya NO inicia sesión)
      // =========================
      register: async (data) => {
        set({ isLoading: true });
        try {
          const response = await authService.register(data);

          // 🚫 No guardamos token ni usuario aquí
          set({ isLoading: false });

          // ✅ Devuelve el mensaje del backend (por ejemplo: “Revisa tu correo…”)
          return response;
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      // =========================
      // LOGOUT
      // =========================
      logout: () => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("user");
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },

      // =========================
      // INITIALIZE (si hay token → obtener perfil)
      // =========================
      initializeAuth: async () => {
        const token = localStorage.getItem("access_token");
        if (!token) {
          set({ user: null, isAuthenticated: false });
          return;
        }

        try {
          const user = await authService.getProfile();
          localStorage.setItem("user", JSON.stringify(user));
          set({
            user,
            isAuthenticated: true,
          });
        } catch (error) {
          // Token inválido o expirado
          localStorage.removeItem("access_token");
          localStorage.removeItem("user");
          set({
            user: null,
            isAuthenticated: false,
          });
        }
      },

      // =========================
      // GET TOKEN
      // =========================
      getToken: () => localStorage.getItem("access_token") || undefined,
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
