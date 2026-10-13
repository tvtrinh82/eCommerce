import { apiClient } from '@/lib/api-client';
import { CreateOrderRequest, Order, OrderStatus } from './types';

export const orderApi = {
  getOrders: async (params?: any) => {
    const res: any = await apiClient.get('/orders', { params });
    return res.data || res;
  },

  getCustomerOrders: async (
    customerId: number,
    params?: { page?: number; size?: number; status?: OrderStatus; sort?: string }
  ): Promise<Order[]> => {
    const res: any = await apiClient.get(`/orders/customer/${customerId}`, { params });
    const data = res.data || res;
    if (Array.isArray(data)) return data;
    if (data.content && Array.isArray(data.content)) return data.content;
    return [];
  },

  getOrderById: async (id: number | string): Promise<Order> => {
    const res: any = await apiClient.get(`/orders/${id}`);
    return res.data || res;
  },

  createOrder: async (data: CreateOrderRequest): Promise<Order> => {
    const res: any = await apiClient.post('/orders', data);
    const result = res.data || res;
    return Array.isArray(result) ? result[0] : result;
  },

  updateOrderItems: async (id: string | number, data: any) => {
    const res: any = await apiClient.put(`/orders/${id}/items`, data);
    return res.data || res;
  },

  checkoutOrder: async (id: number | string): Promise<any> => {
    const res: any = await apiClient.post(`/orders/${id}/checkout`);
    return res.data || res;
  },

  deleteOrder: async (id: number | string): Promise<any> => {
    const res: any = await apiClient.delete(`/orders/${id}`);
    return res.data || res;
  },

  requestRefund: async (id: number | string, reason: string): Promise<Order> => {
    const res: any = await apiClient.post(`/orders/${id}/refund-request`, { reason });
    return res.data || res;
  },
};