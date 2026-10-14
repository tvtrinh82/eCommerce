import React from 'react';
import { Tag } from 'antd';

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

interface StatusTagProps {
  status: OrderStatus | string;
}

const statusConfig: Record<string, { color: string; label: string }> = {
  PENDING: { color: 'gold', label: 'Chờ duyệt' },
  AWAITING_PAYMENT: { color: 'orange', label: 'Chờ thanh toán' },
  PAID: { color: 'green', label: 'Đã thanh toán' },
  CONFIRMED: { color: 'blue', label: 'Đã xác nhận' },
  PROCESSING: { color: 'processing', label: 'Đang xử lý / Đang giao' },
  COMPLETED: { color: 'cyan', label: 'Hoàn thành' },
  CANCELLED: { color: 'red', label: 'Đã hủy' },
  REFUND_REQUESTED: { color: 'purple', label: 'Yêu cầu hoàn tiền' },
  REFUNDED: { color: 'default', label: 'Đã hoàn tiền' },
};

export const StatusTag: React.FC<StatusTagProps> = ({ status }) => {
  const config = statusConfig[status];
  
  if (!config) {
    return <Tag>{status}</Tag>;
  }

  return (
    <Tag color={config.color}>
      {config.label}
    </Tag>
  );
};
