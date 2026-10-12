import { useQuery, useMutation, useQueryClient, Query } from '@tanstack/react-query';
import { orderApi } from './api';
import { OrderDetail } from './types';

export const useOrders = (params: any, options?: { refetchInterval?: number | false }) => {
  return useQuery({
    queryKey: ['orders', params],
    queryFn: () => orderApi.getOrders(params),
    refetchInterval: options?.refetchInterval ?? 3000, // Tự động làm mới mỗi 3 giây
    refetchOnWindowFocus: true, // Tự động làm mới ngay khi chuyển tab quay lại
  });
};

export const useOrderDetail = (orderId: string | number) => {
  return useQuery({
    queryKey: ['order', orderId],
    queryFn: () => orderApi.getOrderDetail(orderId),
    enabled: !!orderId,
    refetchInterval: (query: Query<OrderDetail, Error>) => {
      const order = query.state.data;
      // Nếu đã hoàn thành hoặc đã huỷ thì giảm tần suất hoặc dừng, còn đang PENDING / AWAITING_PAYMENT thì poll mỗi 3 giây
      if (order?.status === 'CANCELLED' || (order?.paymentStatus === 'PAID' && order?.status === 'COMPLETED')) {
        return false;
      }
      return 3000;
    },
    refetchOnWindowFocus: true,
  });
};

export const useOrder = useOrderDetail;

export const useCreateOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => orderApi.createOrder(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
};

export const useUpdateOrderItems = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string | number; data: any }) =>
      orderApi.updateOrderItems(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['order', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
};