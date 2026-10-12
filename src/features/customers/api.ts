import { apiClient } from '@/lib/api-client';
import { CustomerPayload } from './types';

export const customerApi = {
  getCustomers: async (params?: any) => {
    return apiClient.get('/customers', { params });
  },
  createCustomer: async (data: CustomerPayload) => {
    return apiClient.post('/customers', data);
  },
  updateCustomer: async (id: number, data: CustomerPayload) => {
    return apiClient.put(`/customers/${id}`, data);
  },
  deleteCustomer: async (id: number) => {
    return apiClient.delete(`/customers/${id}`);
  }
};
