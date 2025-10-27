import api from './api';

export interface BuyerStats {
  favoritesCount: number;
  activeChatsCount: number;
  activeProductsCount?: number;
}

export interface SellerStats {
  productsCount: number;
  activeChatsCount: number;
  averageRating: number;
  totalSales: number;
}

export interface AdminStats {
  usersCount: number;
  incidentsCount: number;
  reportsCount: number;
  productsCount: number;
}

export const dashboardService = {
  getBuyerStats: async (): Promise<BuyerStats> => {
    const response = await api.get('/dashboard/buyer-stats');
    return response.data;
  },

  getSellerStats: async (): Promise<SellerStats> => {
    const response = await api.get('/dashboard/seller-stats');
    return response.data;
  },

  getAdminStats: async (): Promise<AdminStats> => {
    const response = await api.get('/dashboard/admin-stats');
    return response.data;
  },
};