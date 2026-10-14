export interface Product {
  id: number;
  name: string;
  brand: string;
  model: string;
  tag?: string; // e.g. "Best Seller", "New", "-20%"
  specs: string; // e.g. "256GB • Titanium Blue"
  price: number;
  oldPrice?: number;
  discountPercent?: number;
  rating: number;
  reviewsCount: number;
  imageUrl: string;
  inStock: boolean;
  stockCount?: number;
  colors?: string[];
  displaySize?: string;
  chipset?: string;
}

export interface CartItem {
  productId: number;
  name: string;
  price: number;
  quantity: number;
  image: string;
  specs?: string;
  color?: string;
}

export interface ShippingAddress {
  fullName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  postalCode: string;
  notes?: string;
}

export interface PaymentDetails {
  method: "card" | "paypal" | "applepay" | "cod";
  cardNumber?: string;
  cardHolder?: string;
  expiryDate?: string;
  cvv?: string;
}

export interface OrderStatus {
  orderId: string;
  status: "PLACED" | "PROCESSING" | "SHIPPED" | "OUT_FOR_DELIVERY" | "DELIVERED";
  createdAt: string;
  estimatedDelivery: string;
  currentStep: number;
  carrier: string;
  trackingNumber: string;
  timeline: {
    title: string;
    description: string;
    time: string;
    completed: boolean;
  }[];
}
