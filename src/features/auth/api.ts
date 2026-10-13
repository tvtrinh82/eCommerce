import { apiClient } from '@/lib/api-client';
import { AuthResponse, LoginFormData, RegisterFormData, UserResponse } from './types';

export const authApi = {
  login: async (data: LoginFormData): Promise<AuthResponse> => {
    const res: any = await apiClient.post('/auth/login', data);
    return res.data || res;
  },

  register: async (data: RegisterFormData): Promise<UserResponse> => {
    const res: any = await apiClient.post('/auth/register', {
      name: data.name,
      email: data.email,
      phone: data.phone,
      password: data.password,
    });
    return res.data || res;
  },

  getCurrentUser: async (): Promise<UserResponse | null> => {
    try {
      const res: any = await apiClient.get('/auth/me');
      const user = res.data || res;
      if (user && user.customerId) {
        try {
          const custRes: any = await apiClient.get(`/customers/${user.customerId}`);
          const customer = custRes.data || custRes;
          return {
            ...user,
            name: customer.name || user.name || user.email,
            phone: customer.phone || user.phone,
          };
        } catch {
          return user;
        }
      }
      return user;
    } catch {
      return null;
    }
  },

  logout: async (): Promise<void> => {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Ignore error on logout
    }
  },
};
