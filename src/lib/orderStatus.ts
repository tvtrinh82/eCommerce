export const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING: "Chờ duyệt",
  AWAITING_PAYMENT: "Chờ thanh toán",
  PAID: "Đã thanh toán",
  CONFIRMED: "Đã xác nhận",
  PROCESSING: "Đang xử lý / Đang giao",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Đã hủy",
  REFUND_REQUESTED: "Yêu cầu hoàn tiền",
  REFUNDED: "Đã hoàn tiền",
};

export const getOrderStatusLabel = (status?: string | null): string => {
  if (!status) return "Chờ duyệt";
  return ORDER_STATUS_LABELS[status] || status;
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: "Chưa thanh toán",
  UNPAID: "Chưa thanh toán",
  PAID: "Đã thanh toán",
  FAILED: "Thanh toán thất bại",
  CANCELLED: "Đã hủy thanh toán",
  SUCCESS: "Thanh toán thành công",
  REFUNDED: "Đã hoàn tiền",
};

export const getPaymentStatusLabel = (status?: string | null): string => {
  if (!status) return "Chưa thanh toán";
  return PAYMENT_STATUS_LABELS[status] || status;
};
