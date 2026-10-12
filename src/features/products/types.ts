export interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  status: string;
  imageUrl?: string;
  oldPrice?: number;
  category?: string;
}

export interface ProductPayload {
  name: string;
  price: number;
  stock: number;
  status: string;
  imageUrl?: string;
}
