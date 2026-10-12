export interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  status: string;
  ordersCount?: number;
  totalSpent?: number;
}

export interface CustomerPayload {
  name: string;
  email: string;
  phone?: string;
  status?: string;
}

export interface GetCustomersParams {
  page?: number;
  size?: number;
  keyword?: string;
}
