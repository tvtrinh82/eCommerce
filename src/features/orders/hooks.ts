import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { orderApi } from './api';
import { CreateOrderRequest, OrderStatus } from './types';
import { App } from 'antd';

export const ORDERS_QUERY_KEY = ['orders'];

export function useOrders(params?: any, options?: { refetchInterval?: number | false }) {
  return useQuery({
    queryKey: [...ORDERS_QUERY_KEY, params],
    queryFn: () => orderApi.getOrders(params),
    refetchInterval: options?.refetchInterval ?? 3000,
    refetchOnWindowFocus: true,
  });
}

export function useCustomerOrders(
  customerId: number | undefined | null,
  params?: { page?: number; size?: number; status?: OrderStatus; sort?: string }
) {
  return useQuery({
    queryKey: [...ORDERS_QUERY_KEY, 'customer', customerId, params],
    queryFn: () => orderApi.getCustomerOrders(customerId as number, params),
    enabled: !!customerId,
    staleTime: 30 * 1000,
  });
}

export function useOrderDetail(id: number | string | undefined | null) {
  return useQuery({
    queryKey: ['order', id],
    queryFn: () => orderApi.getOrderById(id as number | string),
    enabled: !!id,
    refetchInterval: (query) => {
      const order = query.state.data;
      if (
        order?.status === 'CANCELLED' ||
        (order?.paymentStatus === 'PAID' && order?.status === 'COMPLETED')
      ) {
        return false;
      }
      return 4000;
    },
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  return useMutation({
    mutationFn: (data: CreateOrderRequest) => orderApi.createOrder(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ORDERS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
    onError: (err: any) => {
      const errorMsg = err?.message || err?.response?.data?.message || 'Tạo đơn hàng thất bại';
      message.error(errorMsg);
    },
  });
}

export function useUpdateOrderItems() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string | number; data: any }) =>
      orderApi.updateOrderItems(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['order', variables.id] });
      queryClient.invalidateQueries({ queryKey: ORDERS_QUERY_KEY });
    },
  });
}

export function useDeleteOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number | string) => orderApi.deleteOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ORDERS_QUERY_KEY });
    },
  });
}