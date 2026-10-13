import { apiClient } from '@/lib/api-client';
import { AddToCartRequest, Cart, UpdateCartItemRequest } from './types';

export const cartApi = {
  getCart: async (): Promise<Cart> => {
    const res: any = await apiClient.get('/cart');
    const data = res.data || res;
    return {
      id: data.id || 0,
      customerId: data.customerId ?? null,
      items: Array.isArray(data.items) ? data.items : [],
      totalItems: Array.isArray(data.items) ? data.items.length : (data.totalItems ?? 0),
      totalAmount: data.totalAmount ?? 0,
    };
  },

  addToCart: async (request: AddToCartRequest): Promise<Cart> => {
    const res: any = await apiClient.post('/cart/items', request);
    return res.data || res;
  },

  updateQuantity: async (productId: number, request: UpdateCartItemRequest): Promise<Cart> => {
    const res: any = await apiClient.put(`/cart/items/${productId}`, request);
    return res.data || res;
  },

  removeItem: async (productId: number): Promise<Cart> => {
    const res: any = await apiClient.delete(`/cart/items/${productId}`);
    return res.data || res;
  },

  clearCart: async (): Promise<Cart> => {
    const res: any = await apiClient.delete('/cart');
    return res.data || res;
  },
};
