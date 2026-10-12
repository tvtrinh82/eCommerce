import { apiClient } from '@/lib/api-client';
import { PaymentTransactionResponse, ProcessPaymentRequest } from './types';

export const paymentApi = {
  // Lấy thông tin thanh toán theo orderId hoặc transactionId
  getPaymentInfo: async (orderId: string | number): Promise<PaymentTransactionResponse> => {
    const response = await apiClient.get<PaymentTransactionResponse>(`/payments/${orderId}`);
    return response.data;
  },

  // Giả lập kết quả thanh toán thành công hoặc thất bại
  processPayment: async (data: ProcessPaymentRequest): Promise<void> => {
    await apiClient.post('/payments/mock-process', data);
  },
};