export interface CartItem {
  id: number;
  productId: number;
  productName: string;
  imageUrl?: string | null;
  price: number;
  quantity: number;
  stock: number;
  subtotal: number;
}

export interface Cart {
  id: number;
  customerId: number | null;
  items: CartItem[];
  totalItems: number;
  totalAmount: number;
}

export interface AddToCartRequest {
  productId: number;
  quantity: number;
}

export interface UpdateCartItemRequest {
  quantity: number;
}
