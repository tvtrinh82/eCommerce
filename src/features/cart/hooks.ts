import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { cartApi } from './api';
import { AddToCartRequest, Cart, UpdateCartItemRequest } from './types';
import { useCurrentUser } from '@/features/auth/hooks';
import { App } from 'antd';

export const CART_QUERY_KEY = ['cart'];

export function useCart() {
  const { data: user } = useCurrentUser();

  return useQuery({
    queryKey: CART_QUERY_KEY,
    queryFn: () => cartApi.getCart(),
    enabled: !!user && user?.role === 'USER',
    staleTime: 30 * 1000,
  });
}

export function useAddToCart() {
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  return useMutation({
    mutationFn: (request: AddToCartRequest) => cartApi.addToCart(request),
    onSuccess: (updatedCart) => {
      queryClient.setQueryData(CART_QUERY_KEY, updatedCart);
      message.success('Đã thêm sản phẩm vào giỏ hàng!');
    },
    onError: (err: any) => {
      const errorMsg = err?.message || err?.response?.data?.message || 'Không thể thêm sản phẩm vào giỏ hàng';
      message.error(errorMsg);
    },
  });
}

export function useUpdateCartItem() {
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  return useMutation({
    mutationFn: ({ productId, request }: { productId: number; request: UpdateCartItemRequest }) =>
      cartApi.updateQuantity(productId, request),
    onSuccess: (updatedCart) => {
      queryClient.setQueryData(CART_QUERY_KEY, updatedCart);
    },
    onError: (err: any) => {
      const errorMsg = err?.message || err?.response?.data?.message || 'Cập nhật giỏ hàng thất bại';
      message.error(errorMsg);
    },
  });
}

export function useRemoveCartItem() {
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  return useMutation({
    mutationFn: (productId: number) => cartApi.removeItem(productId),
    onSuccess: (updatedCart) => {
      queryClient.setQueryData(CART_QUERY_KEY, updatedCart);
      message.success('Đã xóa sản phẩm khỏi giỏ hàng');
    },
    onError: (err: any) => {
      const errorMsg = err?.message || err?.response?.data?.message || 'Không thể xóa sản phẩm';
      message.error(errorMsg);
    },
  });
}

export function useClearCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => cartApi.clearCart(),
    onSuccess: (updatedCart) => {
      queryClient.setQueryData(CART_QUERY_KEY, updatedCart);
    },
  });
}
