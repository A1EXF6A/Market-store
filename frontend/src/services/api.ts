import axios from 'axios';
import Cookies from 'js-cookie';
import { toast } from 'sonner';

export const API_BASE = 'http://localhost:3000';

export const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // No mostrar toast de sesión expirada para rutas de autenticación
      const isAuthRoute = error.config?.url?.includes('/auth/');
      
      if (!isAuthRoute) {
        Cookies.remove('access_token');
        localStorage.removeItem('access_token');
        toast.error('Sesión expirada. Por favor, inicia sesión nuevamente');
      }
    } else if (error.code === 'NETWORK_ERROR' || !error.response) {
      toast.error('Error de conexión. Verifica tu conexión a internet');
    } else if (error.response?.status >= 500) {
      toast.error('Error del servidor. Intenta nuevamente más tarde');
    }
    return Promise.reject(error);
  }
);

export default api;