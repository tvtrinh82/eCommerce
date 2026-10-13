import { z } from 'zod';

export interface UserResponse {
  id: number;
  email: string;
  role: 'USER' | 'PRODUCT_OWNER' | 'ADMIN';
  status: 'ACTIVE' | 'INACTIVE' | 'UNVERIFIED' | 'LOCKED';
  customerId: number | null;
  name?: string;
  phone?: string;
  createdAt: string;
}

export interface AuthResponse {
  tokenType: string;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: UserResponse;
}

export const loginSchema = z.object({
  email: z.string().min(1, 'Email không được để trống').email('Email không đúng định dạng'),
  password: z.string().min(1, 'Mật khẩu không được để trống'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  name: z.string().min(2, 'Họ tên phải có ít nhất 2 ký tự'),
  email: z
    .string()
    .min(1, 'Email không được để trống')
    .regex(/^[A-Za-z0-9._%+-]+@gmail\.com$/, 'Email phải có đuôi @gmail.com'),
  phone: z
    .string()
    .min(1, 'Số điện thoại không được để trống')
    .regex(/^0\d{9}$/, 'Số điện thoại phải bắt đầu bằng 0 và có đúng 10 số'),
  password: z
    .string()
    .min(8, 'Mật khẩu phải có ít nhất 8 ký tự')
    .regex(/[A-Z]/, 'Mật khẩu phải chứa ít nhất 1 chữ hoa')
    .regex(/[a-z]/, 'Mật khẩu phải chứa ít nhất 1 chữ thường')
    .regex(/[0-9]/, 'Mật khẩu phải chứa ít nhất 1 chữ số')
    .regex(/[!@#$%^&*()_\-+=\[\]{};:'",.<>/?\\|`~]/, 'Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt'),
  confirmPassword: z.string().min(1, 'Vui lòng xác nhận mật khẩu'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Mật khẩu xác nhận không khớp',
  path: ['confirmPassword'],
});

export type RegisterFormData = z.infer<typeof registerSchema>;
