import api from "./api";
import type { Product, ProductFilters } from "@/types";

export interface CreateProductData {
  name: string;
  description?: string;
  category?: string;
  price?: number;
  location?: string;
  latitude?: number;
  longitude?: number;
  type: "product" | "service";
  workingHours?: string;
  images?: File[];
}

export interface UpdateProductData extends Partial<CreateProductData> {
  removedImages?: string[];
}

export const productsService = {
  getAll: async (filters?: ProductFilters): Promise<Product[]> => {
    const params = new URLSearchParams();

    if (filters?.type) params.append("type", filters.type);
    if (filters?.category) params.append("category", filters.category);
    if (filters?.minPrice)
      params.append("minPrice", filters.minPrice.toString());
    if (filters?.maxPrice)
      params.append("maxPrice", filters.maxPrice.toString());
    if (filters?.location) params.append("location", filters.location);
  if (filters?.status) params.append("status", filters.status);
    if (filters?.search) params.append("search", filters.search);

    const queryString = params.toString();
    const response = await api.get(
      `/products${queryString ? `?${queryString}` : ""}`,
    );
    return response.data;
  },

  getById: async (id: number): Promise<Product> => {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },

  getMyProducts: async (): Promise<Product[]> => {
    const response = await api.get("/products/my-products");
    return response.data;
  },

  getFavorites: async (): Promise<Product[]> => {
    const response = await api.get("/products/favorites");

    return response.data;
  },

  create: async (data: CreateProductData): Promise<Product> => {
    const formData = new FormData();

    // Add text fields
    formData.append("name", data.name);
    if (data.description) formData.append("description", data.description);
    if (data.category) formData.append("category", data.category);
    if (data.price) formData.append("price", data.price.toString());
    if (data.location) formData.append("location", data.location);
    if (data.latitude) formData.append("latitude", data.latitude.toString());
    if (data.longitude) formData.append("longitude", data.longitude.toString());
    formData.append("type", data.type);
    if (data.workingHours) formData.append("workingHours", data.workingHours);

    // Add images
    if (data.images) {
      data.images.forEach((image) => {
        formData.append("images", image);
      });
    }

    const response = await api.post("/products", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  update: async (id: number, data: UpdateProductData): Promise<Product> => {
    const formData = new FormData();

    // Add text fields
    if (data.name) formData.append("name", data.name);
    if (data.description) formData.append("description", data.description);
    if (data.category) formData.append("category", data.category);
    if (data.price) formData.append("price", data.price.toString());
    if (data.location) formData.append("location", data.location);
    if (data.latitude) formData.append("latitude", data.latitude.toString());
    if (data.longitude) formData.append("longitude", data.longitude.toString());
    if (data.type) formData.append("type", data.type);
    if (data.workingHours) formData.append("workingHours", data.workingHours);

    // Add images
    if (data.images) {
      data.images.forEach((image) => {
        formData.append("images", image);
      });
    }

    // Add removed images
    if (data.removedImages) {
      data.removedImages.forEach((imageUrl) => {
        formData.append("removedImages", imageUrl);
      });
    }

    const response = await api.patch(`/products/${id}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  updateAvailability: async (
    id: number,
    available: boolean,
  ): Promise<Product> => {
    const response = await api.patch(`/products/${id}/availability`, {
      available,
    });
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/products/${id}`);
  },

  toggleFavorite: async (id: number): Promise<void> => {
    await api.post(`/products/${id}/favorite`);
  },

  deleteImage: async (productId: number, imageUrl: string): Promise<void> => {
    await api.delete(`/products/${productId}/images`, {
      data: { imageUrl },
    });
  },

  hideProduct: async (id: number, reason: string): Promise<void> => {
    await api.patch(`/products/${id}/status`, { status: "hidden", reason });
  },

  suspendProduct: async (id: number, reason: string): Promise<void> => {
    await api.patch(`/products/${id}/status`, { status: "suspended", reason });
  },

  banProduct: async (id: number, reason: string): Promise<void> => {
    await api.patch(`/products/${id}/status`, { status: "banned", reason });
  },

  activateProduct: async (id: number): Promise<void> => {
    await api.patch(`/products/${id}/status`, { status: "active" });
  },
};
