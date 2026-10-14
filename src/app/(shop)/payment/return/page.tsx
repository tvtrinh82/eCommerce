'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Result, Button, Spin, Card, Typography, Descriptions } from 'antd';
import { CheckCircleFilled, CloseCircleFilled, ShoppingOutlined, EyeOutlined } from '@ant-design/icons';
import { apiClient } from '@/lib/api-client';
import { formatCurrency } from '@/lib/format';
import styles from './PaymentReturn.module.scss';

const { Title, Text } = Typography;

function PaymentReturnContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Lấy các tham số cơ bản từ query URL
  const vnpResponseCode = searchParams.get('vnp_ResponseCode');
  const vnpTxnRef = searchParams.get('vnp_TxnRef');
  const vnpAmount = searchParams.get('vnp_Amount');
  const vnpOrderInfo = searchParams.get('vnp_OrderInfo');
  const vnpTransactionNo = searchParams.get('vnp_TransactionNo');
  const vnpBankCode = searchParams.get('vnp_BankCode');

  // Trích xuất Order ID dự phòng từ vnpTxnRef (dạng "11_1791685735903_365dcd") hoặc vnp_OrderInfo ("Thanh toan don hang #11")
  const extractedOrderId = (() => {
    if (vnpTxnRef && vnpTxnRef.includes('_')) {
      const parts = vnpTxnRef.split('_');
      if (parts[0] && !isNaN(Number(parts[0]))) {
        return parts[0];
      }
    }
    if (vnpOrderInfo) {
      const match = vnpOrderInfo.match(/#(\d+)/);
      if (match) return match[1];
    }
    return null;
  })();

  useEffect(() => {
    const processResult = async () => {
      try {
        setLoading(true);
        // Gửi toàn bộ query parameters sang backend để xác thực chữ ký và cập nhật giao dịch
        const queryString = searchParams.toString();
        const res: any = await apiClient.get(`/payments/vnpay/return?${queryString}`);
        setResult(res.data?.data || res.data || res);
      } catch (err: any) {
        setErrorMsg(err?.response?.data?.message || err?.message || 'Không thể xác thực giao dịch');
      } finally {
        setLoading(false);
      }
    };

    if (searchParams && searchParams.toString()) {
      processResult();
    } else {
      setLoading(false);
      setErrorMsg('Không tìm thấy thông tin giao dịch trả về');
    }
  }, [searchParams]);

  if (loading) {
    return (
      <div className={styles.loadingWrap}>
        <Spin size="large" tip="Đang kiểm tra và xác nhận kết quả giao dịch VNPay..." />
      </div>
    );
  }

  const orderId = result?.orderId || extractedOrderId;
  const isSuccess = vnpResponseCode === '00';
  const amount = result?.amount || (vnpAmount ? Number(vnpAmount) / 100 : 0);

  return (
    <div className={styles.container}>
      <Card className={styles.card}>
        <Result
          status={isSuccess ? 'success' : 'error'}
          title={isSuccess ? 'Thanh toán thành công!' : 'Thanh toán không thành công'}
          subTitle={
            isSuccess
              ? 'Đơn hàng của bạn đã được thanh toán và đang được xử lý.'
              : (result?.message || errorMsg || 'Giao dịch bị huỷ hoặc có lỗi xảy ra trong quá trình thanh toán.')
          }
          extra={[
            orderId && (
              <Button
                type="primary"
                key="order"
                icon={<EyeOutlined />}
                size="large"
                className={styles.actionBtn}
                onClick={() => router.push(`/orders/${orderId}`)}
              >
                Xem chi tiết đơn hàng #{orderId}
              </Button>
            ),
            <Button
              key="history"
              icon={<ShoppingOutlined />}
              size="large"
              className={styles.actionBtn}
              onClick={() => router.push('/orders/history')}
            >
              Lịch sử đơn hàng
            </Button>,
          ]}
        >
          <div className={styles.detailsWrap}>
            <Descriptions title="Chi tiết giao dịch" column={1} size="small" bordered>
              {orderId && (
                <Descriptions.Item label="Mã đơn hàng">
                  <strong>#{orderId}</strong>
                </Descriptions.Item>
              )}
              {amount > 0 && (
                <Descriptions.Item label="Số tiền thanh toán">
                  <span className={isSuccess ? styles.amountSuccess : styles.amountError}>
                    {formatCurrency(amount)}
                  </span>
                </Descriptions.Item>
              )}
              {vnpBankCode && (
                <Descriptions.Item label="Ngân hàng">
                  {vnpBankCode}
                </Descriptions.Item>
              )}
              {vnpTransactionNo && (
                <Descriptions.Item label="Mã giao dịch VNPay">
                  {vnpTransactionNo}
                </Descriptions.Item>
              )}
              <Descriptions.Item label="Trạng thái">
                {isSuccess ? (
                  <span className={styles.statusSuccess}>Thành công (00)</span>
                ) : (
                  <span className={styles.statusError}>
                    Thất bại (Mã: {vnpResponseCode || 'Lỗi'})
                  </span>
                )}
              </Descriptions.Item>
            </Descriptions>
          </div>
        </Result>
      </Card>
    </div>
  );
}

import ClientLayout from '@/components/shared/ClientLayout';

export default function PaymentReturnPage() {
  return (
    <ClientLayout>
      <Suspense fallback={
        <div className={styles.loadingWrap}>
          <Spin size="large" />
        </div>
      }>
        <PaymentReturnContent />
      </Suspense>
    </ClientLayout>
  );
}
