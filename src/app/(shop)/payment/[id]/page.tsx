'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button, Spin, Alert, message } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';

import { usePaymentInfo, useProcessPayment } from '@/features/payments/hooks';
import { formatCurrency, formatTime } from '@/lib/format';

export default function MockPaymentPage() {
    const params = useParams();
    const router = useRouter();
    const orderId = params?.id as string;

    const { data: payment, isLoading, isError, error } = usePaymentInfo(orderId);
    const processPaymentMutation = useProcessPayment();

    // Xử lý xác nhận thanh toán
    const handlePaymentAction = async (isSuccess: boolean) => {
        if (!payment) return;

        try {
            await processPaymentMutation.mutateAsync({
                transactionId: payment.transactionId,
                orderId: payment.orderId,
                isSuccess,
                failureReason: isSuccess ? undefined : 'Người dùng huỷ thanh toán hoặc thanh toán thất bại',
            });

            message.success(isSuccess ? 'Thanh toán thành công!' : 'Đã ghi nhận thanh toán thất bại.');
            // Tiêu chí: Chọn xong thì quay về trang chi tiết đơn
            router.push(`/orders/${orderId}`);
        } catch (err: any) {
            message.error(err?.response?.data?.message || 'Có lỗi xảy ra khi xử lý giao dịch.');
        }
    };

    const containerStyle: React.CSSProperties = { minHeight: '100vh', backgroundColor: '#f5f5f5', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 24 };
    const cardStyle: React.CSSProperties = { width: '100%', maxWidth: 480, backgroundColor: '#ffffff', borderRadius: 8, boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)', border: '1px solid #e8e8e8', overflow: 'hidden' };
    const loadingWrapperStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px' };

    if (isLoading) {
        return (
            <div style={containerStyle}>
                <div style={{ ...cardStyle, ...loadingWrapperStyle }}>
                    <Spin size="large" tip="Đang tải thông tin cổng thanh toán..." />
                </div>
            </div>
        );
    }

    if (isError || !payment) {
        return (
            <div style={containerStyle}>
                <div style={{ ...cardStyle, ...loadingWrapperStyle }}>
                    <Alert
                        message="Không tìm thấy thông tin thanh toán"
                        description={error?.message || 'Giao dịch không tồn tại hoặc đơn hàng đã hoàn tất.'}
                        type="error"
                        showIcon
                    />
                    <Button
                        type="default"
                        style={{ flex: 1, height: 40, marginTop: 16 }}
                        onClick={() => router.push(`/orders/${orderId}`)}
                    >
                        Quay lại đơn hàng
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div style={containerStyle}>
            <div style={cardStyle}>
                {/* Header Cổng thanh toán giả lập */}
                <div style={{ padding: '16px 24px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h1 style={{ fontSize: 16, fontWeight: 600, color: '#262626', margin: 0 }}>Cổng thanh toán (giả lập)</h1>
                    <span style={{ fontSize: 12, color: '#8c8c8c', backgroundColor: '#fafafa', padding: '2px 8px', borderRadius: 4, border: '1px solid #d9d9d9' }}>Mock Gateway</span>
                </div>

                {/* Nội dung thanh toán theo Wireframe B4 */}
                <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 14, color: '#595959' }}>Mã giao dịch:</span>
                        <span style={{ fontSize: 14, fontWeight: 500, color: '#262626' }}>{payment.transactionId}</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 14, color: '#595959' }}>Đơn hàng:</span>
                        <span style={{ fontSize: 14, fontWeight: 500, color: '#262626' }}>#{payment.orderId}</span>
                    </div>

                    <div style={{ height: 1, backgroundColor: '#f0f0f0', margin: '4px 0' }} />

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 14, color: '#595959' }}>Số tiền thanh toán:</span>
                        <span style={{ fontSize: 24, fontWeight: 700, color: '#ff4d4f' }}>
                            {formatCurrency(payment.amount)}
                        </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 14, color: '#595959' }}>Thời hạn:</span>
                        <span style={{ fontSize: 13, color: '#8c8c8c' }}>
                            Hết hạn lúc {formatTime(payment.expiresAt)}
                        </span>
                    </div>
                </div>

                {/* 2 nút thao tác theo đúng Wireframe */}
                <div style={{ padding: '16px 24px 24px 24px', display: 'flex', gap: 12 }}>
                    <Button
                        type="primary"
                        icon={<CheckCircleOutlined />}
                        loading={processPaymentMutation.isPending}
                        onClick={() => handlePaymentAction(true)}
                        style={{ flex: 1, height: 40 }}
                    >
                        Thanh toán thành công
                    </Button>

                    <Button
                        danger
                        icon={<CloseCircleOutlined />}
                        loading={processPaymentMutation.isPending}
                        onClick={() => handlePaymentAction(false)}
                        style={{ flex: 1, height: 40 }}
                    >
                        Thanh toán thất bại
                    </Button>
                </div>
            </div>
        </div>
    );
}