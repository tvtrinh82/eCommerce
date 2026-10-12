import { apiClient } from '@/lib/api-client';
import { ProductPayload, Product } from './types';

interface GetProductsParams {
  page?: number;
  size?: number;
  keyword?: string;
  status?: string;
  sort?: string; 
}

export const productApi = {
  getProducts: async (params: GetProductsParams) => {
    
    return apiClient.get('/products', { params });
  },
  
  createProduct: async (data: ProductPayload) => {
    return apiClient.post('/products', data);
  },
  
  updateProduct: async (id: number, data: ProductPayload) => {
    return apiClient.put(`/products/${id}`, data);
  },
  
  deleteProduct: async (id: number) => {
    return apiClient.delete(`/products/${id}`);
  }
};
