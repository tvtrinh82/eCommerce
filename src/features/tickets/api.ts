import { apiClient } from "@/lib/api-client";

export interface TicketResponse {
  id: number;
  orderId: number;
  status:
    | "PENDING"
    | "PENDING_APPROVAL"
    | "PENDING_PO_APPROVE"
    | "PENDING_AD_APPROVE"
    | "APPROVED"
    | "REJECTED"
    | "RETURNED"
    | "CANCELLED"
    | "EXPIRED"
    | "ESCALATED";
  requester?: {
    id: number;
    name: string;
    phone?: string;
  };
  approverId?: number;
  currentLevel?: number;
  requiredLevel?: number;
  dueAt?: string;
  lastComment?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface TicketActionPayload {
  comment?: string;
}

export const ticketApi = {
  // Lấy hộp thư đến vé chờ duyệt cho PO và Admin
  getInbox: async (params?: { status?: string; page?: number; size?: number }) => {
    return apiClient.get("/tickets/inbox", { params });
  },

  // Lấy chi tiết vé theo ID
  getById: async (id: number) => {
    return apiClient.get(`/tickets/${id}`);
  },

  // Lấy chi tiết vé theo ID đơn hàng
  getByOrderId: async (orderId: number) => {
    return apiClient.get(`/tickets/order/${orderId}`);
  },

  // PO / Admin phê duyệt vé
  approve: async (id: number, data?: TicketActionPayload) => {
    return apiClient.post(`/tickets/${id}/approve`, data || {});
  },

  // PO / Admin từ chối vé
  reject: async (id: number, data: { comment: string }) => {
    return apiClient.post(`/tickets/${id}/reject`, data);
  },

  // PO / Admin yêu cầu trả về để sửa
  returnTicket: async (id: number, data: { comment: string }) => {
    return apiClient.post(`/tickets/${id}/return`, data);
  },
};
