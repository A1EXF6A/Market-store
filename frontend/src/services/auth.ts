import api from './api';
import type { AuthResponse, User, UserRole } from '../types';

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  nationalId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
  gender?: 'male' | 'female' | 'other';
  role: UserRole;
  password: string;
}

export const authService = {
  login: async (data: LoginData): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', data);
    return response.data;
  },

  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  getProfile: async (): Promise<User> => {
    const response = await api.get('/auth/profile');
    return response.data;
  },
};