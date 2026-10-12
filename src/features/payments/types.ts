export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED';

export interface PaymentTransactionResponse {
    transactionId: string | number; // Mã giao dịch (vd: 5001)
    orderId: string | number;       // Mã đơn (vd: 100)
    amount: number;                 // Số tiền (vd: 46170000)
    expiresAt: string;              // ISO string thời hạn thanh toán
    status: PaymentStatus;
}

export interface ProcessPaymentRequest {
    transactionId: string | number;
    orderId: string | number;
    isSuccess: boolean;
    failureReason?: string;
}