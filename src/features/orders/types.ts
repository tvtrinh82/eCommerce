export type OrderStatus = 'PENDING' | 'AWAITING_PAYMENT' | 'PAID' | 'CANCELLED' | 'PROCESSING' | 'CONFIRMED' | 'COMPLETED' | 'REFUND_REQUESTED' | 'REFUNDED';

export interface OrderItem {
  id: number;
  productId: number;
  productName: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface OrderDetail {
  id: number;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  shippingAddress?: string;
  status: OrderStatus;
  paymentStatus?: string;
  items: OrderItem[];
  totalAmount: number;
  paidAt?: string;
  createdAt?: string;
  updatedAt?: string;
  cancelReason?: string;
}