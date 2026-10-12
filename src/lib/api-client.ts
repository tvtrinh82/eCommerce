import axios from 'axios';

export const apiClient = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response.data, // Dữ liệu trả về chuẩn hoá theo API đã thống nhất
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/auth/login')) {
        localStorage.removeItem('token');
        window.location.href = '/auth/login';
      }
    }
    // Chuẩn hoá lỗi theo format lỗi đã thống nhất với BE
    return Promise.reject(error.response?.data || error);
  }
);
