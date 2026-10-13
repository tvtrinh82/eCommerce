export type OrderStatus =
  | 'PENDING'
  | 'AWAITING_PAYMENT'
  | 'PAID'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'REFUND_REQUESTED'
  | 'REFUNDED';

export type OrderPaymentStatus = 'UNPAID' | 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED' | string;

export interface OrderItem {
  id?: number;
  productId: number;
  productName: string;
  name?: string;
  quantity: number;
  unitPrice?: number;
  price?: number;
  subTotal?: number;
  subtotal?: number;
  imageUrl?: string | null;
}

export interface Order {
  id: number;
  customerId: number;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  shippingAddress?: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  paymentStatus?: OrderPaymentStatus;
  paidAt?: string;
  cancelReason?: string;
  createdAt: string;
  updatedAt: string;
}

export type OrderDetail = Order;

export interface CreateOrderRequest {
  customerId: number;
  items: {
    productId: number;
    quantity: number;
  }[];
}