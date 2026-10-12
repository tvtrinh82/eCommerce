export type TransitionRule = {
  currentStatus: string;
  label: string;
  targetStatus: string;
  confirmTitle: string;
  actionType: 'cancel_ticket' | 'confirm_ticket' | 'patch_status' | 'approve_refund' | 'reject_refund';
};

export const ORDER_TRANSITIONS: TransitionRule[] = [
  {
    currentStatus: 'PENDING',
    label: 'Xác nhận đơn',
    targetStatus: 'CONFIRMED',
    confirmTitle: 'Xác nhận đơn hàng này (Duyệt) để Khách có thể thanh toán?',
    actionType: 'confirm_ticket'
  },
  {
    currentStatus: 'PENDING',
    label: 'Từ chối / Hủy',
    targetStatus: 'CANCELLED',
    confirmTitle: 'Bạn chắc chắn muốn hủy đơn hàng này?',
    actionType: 'cancel_ticket'
  },
  {
    currentStatus: 'PROCESSING',
    label: 'Đã giao hàng (Hoàn thành)',
    targetStatus: 'COMPLETED',
    confirmTitle: 'Đánh dấu đơn hàng là đã giao thành công (Hoàn thành)?',
    actionType: 'patch_status'
  },
  {
    currentStatus: 'REFUND_REQUESTED',
    label: 'Chấp nhận hoàn tiền',
    targetStatus: 'REFUNDED',
    confirmTitle: 'Bạn đồng ý hoàn tiền cho đơn hàng này?',
    actionType: 'approve_refund'
  },
  {
    currentStatus: 'REFUND_REQUESTED',
    label: 'Từ chối hoàn tiền',
    targetStatus: 'PROCESSING', // Backend decides exact fallback state, UI just triggers reject
    confirmTitle: 'Từ chối yêu cầu hoàn tiền của khách hàng?',
    actionType: 'reject_refund'
  }
];

export const getAvailableTransitions = (status: string, paymentStatus?: string): TransitionRule[] => {
  return ORDER_TRANSITIONS.filter(t => t.currentStatus === status);
};
