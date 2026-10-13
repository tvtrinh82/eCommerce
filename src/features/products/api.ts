import { apiClient } from '@/lib/api-client';
import { PageResponse, Product, ProductListParams, ProductPayload } from './types';

export const productApi = {
  getProducts: async (params?: ProductListParams): Promise<PageResponse<Product>> => {
    const queryParams: any = { ...params };
    if (queryParams?.name && !queryParams.keyword) {
      queryParams.keyword = queryParams.name;
    }
    const res: any = await apiClient.get('/products', { params: queryParams });
    const data = res.data || res;
    if (Array.isArray(data)) {
      return {
        content: data,
        pageNumber: 0,
        pageSize: data.length,
        totalElements: data.length,
        totalPages: 1,
        last: true,
        data,
      };
    }
    return {
      content: data.content || [],
      pageNumber: data.pageNumber ?? 0,
      pageSize: data.pageSize ?? 20,
      totalElements: data.totalElements ?? (data.content?.length || 0),
      totalPages: data.totalPages ?? 1,
      last: data.last ?? true,
      data,
    };
  },

  getProductById: async (id: number | string): Promise<Product> => {
    const res: any = await apiClient.get(`/products/${id}`);
    return res.data || res;
  },

  createProduct: async (data: ProductPayload): Promise<Product> => {
    const res: any = await apiClient.post('/products', data);
    return res.data || res;
  },

  updateProduct: async (id: number | string, data: Partial<ProductPayload>): Promise<Product> => {
    const res: any = await apiClient.put(`/products/${id}`, data);
    return res.data || res;
  },

  deleteProduct: async (id: number | string): Promise<void> => {
    await apiClient.delete(`/products/${id}`);
  },
};
