import Cookies from "js-cookie";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { authService } from "../services/auth";
import type { User } from "../types";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
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

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          const response = await authService.login({ email, password });
          Cookies.set("access_token", response.access_token, { expires: 7 });
          set({
            user: response.user,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (data) => {
        set({ isLoading: true });
        try {
          const response = await authService.register(data);
          Cookies.set("access_token", response.access_token, { expires: 7 });
          set({
            user: response.user,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        Cookies.remove("access_token");
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },

      initializeAuth: async () => {
        const token = Cookies.get("access_token");
        if (token) {
          try {
            const user = await authService.getProfile();
            set({
              user,
              isAuthenticated: true,
            });
          } catch (error) {
            Cookies.remove("access_token");
            set({
              user: null,
              isAuthenticated: false,
            });
          }
        }
      },

      getToken: () => {
        return Cookies.get("access_token");
      },
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

