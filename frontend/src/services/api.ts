import axios from 'axios';
import Cookies from 'js-cookie';

export const API_BASE = 'http://localhost:3000';

export const api = axios.create({
  baseURL: API_BASE,
 
});

api.interceptors.request.use(
  (config) => {
     const token = localStorage.getItem("access_token");
     if (token) config.headers.Authorization = `Bearer ${token}`;
   // Si enviamos FormData, no fijar Content-Type (Axios añade boundary)
    if (config.data instanceof FormData) {
     if (config.headers && "Content-Type" in config.headers) {
      delete (config.headers as any)["Content-Type"];
      }
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
      Cookies.remove('access_token');
      // window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;