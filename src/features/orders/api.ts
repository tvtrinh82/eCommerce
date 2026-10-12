import { apiClient } from '@/lib/api-client';
import { OrderDetail } from './types';

export const orderApi = {
  getOrders: async (params: any) => {
    const res = await apiClient.get('/orders', { params });
    return res.data;
  },
  getOrderDetail: async (id: string | number): Promise<OrderDetail> => {
    const res = await apiClient.get<OrderDetail>(`/orders/${id}`);
    return res.data;
  },
  createOrder: async (data: any) => {
    const res = await apiClient.post('/orders', data);
    return res.data;
  },
  updateOrderItems: async (id: string | number, data: any) => {
    const res = await apiClient.put(`/orders/${id}/items`, data);
    return res.data;
  },
};