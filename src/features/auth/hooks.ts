import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App } from 'antd';
import { authApi } from './api';
import { LoginFormData, RegisterFormData } from './types';
import { setAuthToken, removeAuthToken, getAuthToken } from '@/lib/auth-cookie';
import { useUIStore } from '@/stores/uiStore';
import { useState, useEffect } from 'react';

import { useRouter } from 'next/navigation';

export const AUTH_QUERY_KEY = ['auth', 'currentUser'];

export function useCurrentUser() {
  const [token, setToken] = useState<string | null>(() => (typeof window !== 'undefined' ? getAuthToken() : null));

  useEffect(() => {
    const handleAuthChange = () => {
      setToken(getAuthToken());
    };
    handleAuthChange();
    window.addEventListener('auth-change', handleAuthChange);
    window.addEventListener('storage', handleAuthChange);
    return () => {
      window.removeEventListener('auth-change', handleAuthChange);
      window.removeEventListener('storage', handleAuthChange);
    };
  }, []);

  return useQuery({
    queryKey: AUTH_QUERY_KEY,
    queryFn: () => authApi.getCurrentUser(),
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
  });
}


export function useLogin() {
  const queryClient = useQueryClient();
  const { closeAuthModal, authRedirectUrl, clearAuthRedirectUrl } = useUIStore();
  const { message } = App.useApp();
  const router = useRouter();

  return useMutation({
    mutationFn: (data: LoginFormData) => authApi.login(data),
    onSuccess: (data: any) => {
      const token = data?.accessToken || data?.data?.accessToken || data?.token;
      if (token) {
        setAuthToken(token);
        try {
          localStorage.setItem('token', token);
        } catch {}
      }

      const user = data?.user || data?.data?.user;
      const rawRole =
        user?.role ||
        data?.role ||
        data?.data?.role ||
        data?.data?.user?.role ||
        '';
      const role = String(rawRole).trim().toUpperCase();

      if (role) {
        try {
          localStorage.setItem('role', role);
        } catch {}
      }

      // Cập nhật ngay user vào cache → Header re-render tức thì, không phải đợi refetch
      if (user) {
        queryClient.setQueryData(AUTH_QUERY_KEY, user);
      }
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      message.success('Đăng nhập thành công!');
      closeAuthModal();

      const isManager =
        role === 'ADMIN' ||
        role === 'ROLE_ADMIN' ||
        role === 'PRODUCT_OWNER' ||
        role === 'ROLE_PRODUCT_OWNER' ||
        role === 'PO' ||
        role === 'ROLE_PO';

      if (isManager) {
        router.push('/admin');
      } else if (authRedirectUrl) {
        router.push(authRedirectUrl);
        clearAuthRedirectUrl();
      }
    },
    onError: (err: any) => {
      const errorMsg = err?.message || err?.response?.data?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin!';
      message.error(errorMsg);
    },
  });
}

export function useRegister() {
  const { message } = App.useApp();

  return useMutation({
    mutationFn: (data: RegisterFormData) => authApi.register(data),
    onSuccess: (data) => {
      message.success(
        `Đăng ký tài khoản thành công! Liên kết kích hoạt đã được gửi tới email ${data.email}. Vui lòng kiểm tra hộp thư đến (hoặc thư mục Spam).`,
        6
      );
    },
    onError: (err: any) => {
      const errorMsg = err?.message || err?.response?.data?.message || 'Đăng ký thất bại. Vui lòng kiểm tra lại thông tin!';
      message.error(errorMsg);
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  return useMutation({
    mutationFn: () => authApi.logout(),
    onSettled: () => {
      removeAuthToken();
      queryClient.setQueryData(AUTH_QUERY_KEY, null);
      queryClient.setQueryData(['cart'], null);
      queryClient.removeQueries({ queryKey: ['cart'] });
      queryClient.removeQueries({ queryKey: ['orders'] });
      message.success('Đã đăng xuất');
    },
  });
}
