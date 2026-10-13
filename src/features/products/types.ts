export interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  status: 'ACTIVE' | 'INACTIVE' | string;
  imageUrl: string | null;
  ownerId?: number | null;
  ownerName?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductPayload {
  name: string;
  price: number;
  stock: number;
  imageUrl?: string;
  status?: string;
}

export interface ProductListParams {
  page?: number;
  size?: number;
  keyword?: string;
  name?: string;
  status?: 'ACTIVE' | 'INACTIVE' | string;
  sort?: string;
}

export interface PageResponse<T> {
  content: T[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
  data?: any; // For compatibility
}
