'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button, Spin, Alert, message } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';

import { usePaymentInfo, useProcessPayment } from '@/features/payments/hooks';
import { formatCurrency, formatTime } from '@/lib/format';
import styles from './PaymentPage.module.scss';

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

    if (isLoading) {
        return (
            <div className={styles.container}>
                <div className={`${styles.paymentCard} ${styles.loadingWrapper}`}>
                    <Spin size="large" tip="Đang tải thông tin cổng thanh toán..." />
                </div>
            </div>
        );
    }

    if (isError || !payment) {
        return (
            <div className={styles.container}>
                <div className={`${styles.paymentCard} ${styles.errorWrapper}`}>
                    <Alert
                        message="Không tìm thấy thông tin thanh toán"
                        description={error?.message || 'Giao dịch không tồn tại hoặc đơn hàng đã hoàn tất.'}
                        type="error"
                        showIcon
                    />
                    <Button
                        type="default"
                        className={styles.successButton}
                        onClick={() => router.push(`/orders/${orderId}`)}
                    >
                        Quay lại đơn hàng
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.paymentCard}>
                {/* Header Cổng thanh toán giả lập */}
                <div className={styles.header}>
                    <h1 className={styles.title}>Cổng thanh toán (giả lập)</h1>
                    <span className={styles.tag}>Mock Gateway</span>
                </div>

                {/* Nội dung thanh toán theo Wireframe B4 */}
                <div className={styles.content}>
                    <div className={styles.infoRow}>
                        <span className={styles.label}>Mã giao dịch:</span>
                        <span className={styles.value}>{payment.transactionId}</span>
                    </div>

                    <div className={styles.infoRow}>
                        <span className={styles.label}>Đơn hàng:</span>
                        <span className={styles.value}>#{payment.orderId}</span>
                    </div>

                    <div className={styles.divider} />

                    <div className={styles.infoRow}>
                        <span className={styles.label}>Số tiền thanh toán:</span>
                        <span className={styles.highlightAmount}>
                            {formatCurrency(payment.amount)}
                        </span>
                    </div>

                    <div className={styles.infoRow}>
                        <span className={styles.label}>Thời hạn:</span>
                        <span className={styles.expiredNotice}>
                            Hết hạn lúc {formatTime(payment.expiresAt)}
                        </span>
                    </div>
                </div>

                {/* 2 nút thao tác theo đúng Wireframe */}
                <div className={styles.actions}>
                    <Button
                        type="primary"
                        icon={<CheckCircleOutlined />}
                        loading={processPaymentMutation.isPending}
                        onClick={() => handlePaymentAction(true)}
                        className={styles.successButton}
                    >
                        Thanh toán thành công
                    </Button>

                    <Button
                        danger
                        icon={<CloseCircleOutlined />}
                        loading={processPaymentMutation.isPending}
                        onClick={() => handlePaymentAction(false)}
                        className={styles.failedButton}
                    >
                        Thanh toán thất bại
                    </Button>
                </div>
            </div>
        </div>
    );
}