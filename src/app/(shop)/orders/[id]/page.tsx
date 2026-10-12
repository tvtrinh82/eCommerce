'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Spin, Alert, Button, Table, message, Card, Space, Popconfirm } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useOrderDetail, useUpdateOrderItems } from '@/features/orders/hooks';
import { formatCurrency, formatDateTime } from '@/lib/format';
import { apiClient } from '@/lib/api-client';
import ClientLayout from '@/components/shared/ClientLayout';

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const { data: order, isLoading, isError, error, refetch } = useOrderDetail(id);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState<any>(null);

  // Fetch lịch sử thanh toán nếu đơn hàng đã thanh toán để lấy chính xác giờ phút giây
  useEffect(() => {
    if (order && (order.paymentStatus === 'PAID' || order.status === 'PROCESSING' || order.status === 'COMPLETED')) {
      const fetchPayment = async () => {
        try {
          const res: any = await apiClient.get(`/payments/vnpay/history/${order.id}`);
          const history = res.data?.data || res.data || [];
          if (Array.isArray(history) && history.length > 0) {
            const successTxn = history.find((h: any) => h.status === 'SUCCESS') || history[0];
            setPaymentInfo(successTxn);
          }
        } catch (e) {
          // Silent fallback
        }
      };
      fetchPayment();
    }
  }, [order]);

  // Fake AWAITING_PAYMENT state using localStorage
  const [isAwaitingPayment, setIsAwaitingPayment] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(`awaiting_payment_${id}`)) {
      setIsAwaitingPayment(true);
    }
  }, [id]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isAwaitingPayment && order?.status === 'PENDING' && order?.paymentStatus !== 'PAID') {
      timer = setInterval(() => {
        refetch();
      }, 3000);
    } else if (order?.paymentStatus === 'PAID' || order?.status === 'CANCELLED') {
      setIsAwaitingPayment(false);
      localStorage.removeItem(`awaiting_payment_${id}`);
    }
    return () => clearInterval(timer);
  }, [isAwaitingPayment, order, id, refetch]);

  if (isLoading) {
    return (
      <ClientLayout>
        <div style={{ textAlign: 'center', padding: '100px 0' }}>
          <Spin size="large" tip="Đang tải thông tin đơn hàng..." />
        </div>
      </ClientLayout>
    );
  }

  if (isError || !order) {
    return (
      <ClientLayout>
        <div style={{ maxWidth: 800, margin: '40px auto', padding: '40px 20px' }}>
          <Alert
            message="Lỗi"
            description={error?.message || 'Không tìm thấy thông tin đơn hàng'}
            type="error"
            showIcon
          />
        </div>
      </ClientLayout>
    );
  }

  const handlePayment = async () => {
    setPaymentLoading(true);
    try {
      const res: any = await apiClient.post('/payments/vnpay/create', { orderId: order.id, locale: 'vn' });
      const paymentUrl = res.data?.paymentUrl || res.paymentUrl || res.data?.data?.paymentUrl;
      if (paymentUrl) {
        localStorage.setItem(`awaiting_payment_${order.id}`, 'true');
        setIsAwaitingPayment(true);
        window.location.href = paymentUrl;
      } else {
        message.error("Không tìm thấy đường dẫn thanh toán từ hệ thống");
      }
    } catch (e: any) {
      message.error(e?.response?.data?.message || e?.message || 'Không thể tạo giao dịch thanh toán');
    } finally {
      setPaymentLoading(false);
    }
  };

  const isPending = order.status === 'PENDING';
  const displayStatus = order.paymentStatus === 'PAID' ? 'PAID' : (isAwaitingPayment ? 'AWAITING_PAYMENT' : order.status);

  // Lấy thời gian thanh toán: ưu tiên từ payment history -> order.paidAt -> order.updatedAt
  const paidTime = paymentInfo?.updatedAt || paymentInfo?.createdAt || order.paidAt || order.updatedAt;

  return (
    <ClientLayout>
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '40px 20px', minHeight: '70vh' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, margin: 0 }}>Đơn hàng #{order.id}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              padding: '4px 14px',
              borderRadius: 20,
              border: '1.5px solid',
              borderColor:
                displayStatus === 'COMPLETED' || displayStatus === 'PAID'
                  ? '#52c41a'
                  : displayStatus === 'CONFIRMED' || displayStatus === 'PROCESSING'
                  ? '#1677ff'
                  : displayStatus === 'CANCELLED'
                  ? '#ff4d4f'
                  : '#faad14',
              backgroundColor:
                displayStatus === 'COMPLETED' || displayStatus === 'PAID'
                  ? '#f6ffed'
                  : displayStatus === 'CONFIRMED' || displayStatus === 'PROCESSING'
                  ? '#e6f4ff'
                  : displayStatus === 'CANCELLED'
                  ? '#fff1f0'
                  : '#fffbe6',
              color:
                displayStatus === 'COMPLETED' || displayStatus === 'PAID'
                  ? '#389e0d'
                  : displayStatus === 'CONFIRMED' || displayStatus === 'PROCESSING'
                  ? '#0958d9'
                  : displayStatus === 'CANCELLED'
                  ? '#cf1322'
                  : '#d48806',
              fontWeight: 600,
              fontSize: 13,
            }}>
              {displayStatus}
            </div>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => {
                if (window.history.length > 1) {
                  router.back();
                } else {
                  router.push('/orders/history');
                }
              }}
              style={{ borderRadius: 8, height: 36 }}
            >
              Thoát
            </Button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 24 }}>
          <div style={{ flex: 1 }}>
            <Table
              dataSource={order.items || []}
              rowKey="productId"
              pagination={false}
              columns={[
                { 
                  title: 'Sản phẩm', 
                  dataIndex: 'productName', 
                  key: 'productName',
                  render: (text: string, item: any) => (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={text} style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4 }} />
                      ) : (
                        <div style={{ width: 40, height: 40, backgroundColor: '#f0f0f0', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ fontSize: 10, color: '#999' }}>No img</span>
                        </div>
                      )}
                      <span>{text || item.name || "Sản phẩm"}</span>
                    </div>
                  ),
                },
                {
                  title: 'Đơn giá',
                  dataIndex: 'unitPrice',
                  key: 'unitPrice',
                  render: (val: number) => formatCurrency(val || 0),
                },
                { title: 'Số lượng', dataIndex: 'quantity', key: 'quantity' },
                {
                  title: 'Thành tiền',
                  dataIndex: 'subTotal',
                  key: 'subTotal',
                  render: (val: number) => formatCurrency(val || 0),
                },
              ]}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
              <h3 style={{ margin: 0 }}>Tổng cộng: {formatCurrency(order.totalAmount)}</h3>
            </div>
          </div>

          <div style={{ width: 300 }}>
            <Card title="Khách hàng" style={{ marginBottom: 16 }}>
              <p style={{ margin: '0 0 8px 0' }}><strong>Tên:</strong> {order.customerName}</p>
              <p style={{ margin: 0 }}><strong>Email:</strong> {order.customerEmail}</p>
            </Card>

            <Card title="Thanh toán" style={{ borderColor: isPending ? '#1890ff' : '#d9d9d9' }}>
              <p style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>
                {formatCurrency(order.totalAmount)}
              </p>

              {order.status === 'CANCELLED' && (
                <Alert message="Đã huỷ" description={order.cancelReason || 'Hệ thống đã huỷ đơn'} type="error" showIcon />
              )}

              {order.status === 'PENDING' && (
                <Alert message="Chờ xác nhận" description="Đơn hàng đang chờ người bán duyệt. Bạn chưa thể thanh toán lúc này." type="info" showIcon />
              )}

              {order.status === 'CONFIRMED' && order.paymentStatus !== 'PAID' && (
                <div>
                  {isAwaitingPayment && (
                    <p style={{ color: '#faad14', marginBottom: 16 }}>
                      Trạng thái: chờ thanh toán...
                    </p>
                  )}
                  <Button
                    type="primary"
                    block
                    size="large"
                    onClick={handlePayment}
                    loading={paymentLoading}
                  >
                    {isAwaitingPayment ? 'Mở lại trang thanh toán' : 'Thanh toán'}
                  </Button>
                </div>
              )}

              {(order.paymentStatus === 'PAID' || order.paymentStatus === 'REFUNDED') && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <Alert message={`Đã thanh toán lúc: ${formatDateTime(paidTime)}`} type="success" showIcon />
                  
                  {order.status === 'REFUND_REQUESTED' && (
                    <Alert message="Yêu cầu hoàn tiền đang chờ shop duyệt." type="warning" showIcon />
                  )}
                  
                  {order.status === 'REFUNDED' && (
                    <Alert message="Đã được hoàn tiền thành công." type="success" showIcon />
                  )}
                  
                  {(order.status === 'PROCESSING' || order.status === 'COMPLETED') && (
                    <Popconfirm
                      title="Yêu cầu hoàn tiền"
                      description="Bạn có chắc chắn muốn yêu cầu hoàn tiền cho đơn hàng này không?"
                      onConfirm={async () => {
                        try {
                          await apiClient.post(`/orders/${order.id}/refund-request`, { reason: 'Khách hàng đổi ý' });
                          message.success('Đã gửi yêu cầu hoàn tiền');
                          refetch();
                        } catch (e: any) {
                          message.error(e?.response?.data?.message || 'Lỗi gửi yêu cầu');
                        }
                      }}
                      okText="Gửi yêu cầu"
                      cancelText="Đóng"
                    >
                      <Button danger block>
                        Yêu cầu hoàn tiền
                      </Button>
                    </Popconfirm>
                  )}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </ClientLayout>
  );
}