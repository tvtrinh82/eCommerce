import React from 'react';
import { Tag } from 'antd';

export type OrderStatus = 
  | 'PENDING' 
  | 'AWAITING_PAYMENT' 
  | 'PAID' 
  | 'CONFIRMED' 
  | 'COMPLETED' 
  | 'CANCELLED';

interface StatusTagProps {
  status: OrderStatus | string;
}

const statusConfig: Record<string, { color: string; label: string }> = {
  PENDING: { color: 'gold', label: 'Mới tạo, đang sửa được' },
  AWAITING_PAYMENT: { color: 'orange', label: 'Đã checkout, chờ thanh toán' },
  PAID: { color: 'green', label: 'Đã thanh toán' },
  CONFIRMED: { color: 'blue', label: 'Admin đã xác nhận' },
  COMPLETED: { color: 'cyan', label: 'Hoàn thành' },
  CANCELLED: { color: 'red', label: 'Đã huỷ' },
};

export const StatusTag: React.FC<StatusTagProps> = ({ status }) => {
  const config = statusConfig[status];
  
  if (!config) {
    return <Tag>{status}</Tag>;
  }

  return (
    <Tag color={config.color} title={config.label}>
      {status}
    </Tag>
  );
};
