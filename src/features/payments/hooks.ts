import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentApi } from './api';
import { ProcessPaymentRequest } from './types';

export const usePaymentInfo = (orderId: string | number) => {
  return useQuery({
    queryKey: ['payment', orderId],
    queryFn: () => paymentApi.getPaymentInfo(orderId),
    enabled: !!orderId,
  });
};

export const useProcessPayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ProcessPaymentRequest) => paymentApi.processPayment(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['payment', variables.orderId] });
      queryClient.invalidateQueries({ queryKey: ['order', variables.orderId] });
    },
  });
};