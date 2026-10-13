"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Tabs, Button, Skeleton, Table, App } from 'antd';
import type { TableColumnsType } from 'antd';
import {
  ShoppingOutlined,
  EyeOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  PlusOutlined,
  DownOutlined,
  UpOutlined,
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import ClientLayout from '@/components/shared/ClientLayout';
import { EmptyState } from '@/components/shared/EmptyState/EmptyState';
import { useCustomerOrders } from '@/features/orders/hooks';
import { useCurrentUser } from '@/features/auth/hooks';
import { orderApi } from '@/features/orders/api';
import { apiClient } from '@/lib/api-client';
import { formatCurrency, formatDateOnly, formatTimeOnly } from '@/lib/format';
import { useUIStore } from '@/stores/uiStore';
import { Order, OrderStatus } from '@/features/orders/types';
import styles from './orders.module.scss';

interface OrderItemsCellProps {
  items: any[];
  productMap: Map<number, string>;
}

function OrderItemsCell({ items, productMap }: OrderItemsCellProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!items || items.length === 0) {
    return <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>Không có sản phẩm</span>;
  }

  const hasMultiple = items.length > 1;
  const displayedItems = hasMultiple && !isExpanded ? [items[0]] : items;

  return (
    <div className={styles.tableItemsList}>
      {displayedItems.map((item, idx) => {
        const itemImg =
          item.imageUrl ||
          productMap.get(Number(item.productId)) ||
          '/icon.png';

        return (
          <div key={idx} className={styles.tableItemRow}>
            <img
              src={itemImg}
              alt={item.productName || item.name}
              className={styles.tableItemImg}
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/icon.png';
              }}
            />
            <div className={styles.tableItemDetails}>
              <div className={styles.tableItemName} title={item.productName || item.name}>
                {item.productName || item.name}
              </div>
              <div className={styles.tableItemMeta}>
                Số lượng: <strong>{item.quantity}</strong> × {formatCurrency(item.unitPrice ?? item.price ?? 0)}
              </div>
            </div>
          </div>
        );
      })}

      {hasMultiple && (
        <button
          type="button"
          className={styles.toggleItemsBtn}
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
        >
          {isExpanded ? (
            <>
              Thu gọn <UpOutlined style={{ fontSize: 10, marginLeft: 2 }} />
            </>
          ) : (
            <>
              Xem thêm (+{items.length - 1} sản phẩm) <DownOutlined style={{ fontSize: 10, marginLeft: 2 }} />
            </>
          )}
        </button>
      )}
    </div>
  );
}

export default function CustomerOrdersPage() {
  const router = useRouter();
  const { openAuthModal } = useUIStore();
  const { modal, message } = App.useApp();

  const [isMounted, setIsMounted] = useState(false);
  const { data: user, isLoading: isUserLoading } = useCurrentUser();
  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const customerId = user?.customerId;
  const queryStatus = activeTab === 'ALL' ? undefined : (activeTab as OrderStatus);

  const {
    data: orders = [],
    isLoading: isOrdersLoading,
    refetch,
  } = useCustomerOrders(customerId, { status: queryStatus });

  // Lấy danh sách sản phẩm để luôn có ảnh thật đầy đủ ngay cả khi đơn cũ thiếu imageUrl
  const { data: productsData } = useQuery({
    queryKey: ['products', 'catalog_images'],
    queryFn: async () => {
      const res: any = await apiClient.get('/products?page=0&size=1000');
      return res?.data?.content || res?.content || res?.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const productMap = useMemo(() => {
    const map = new Map<number, string>();
    if (Array.isArray(productsData)) {
      productsData.forEach((p: any) => {
        if (p.id && p.imageUrl) {
          map.set(Number(p.id), p.imageUrl);
        }
      });
    }
    return map;
  }, [productsData]);

  // Đang SSR hoặc đang load thông tin người dùng
  if (!isMounted || isUserLoading) {
    return (
      <ClientLayout>
        <div className={styles.page}>
          <h1 className={styles.title}>Đơn Hàng Của Tôi</h1>
          <Skeleton active paragraph={{ rows: 8 }} />
        </div>
      </ClientLayout>
    );
  }

  // Chưa đăng nhập
  if (!user) {
    return (
      <ClientLayout>
        <div className={styles.page}>
          <h1 className={styles.title}>Đơn Hàng Của Tôi</h1>
          <EmptyState
            title="Bạn chưa đăng nhập"
            description="Vui lòng đăng nhập để xem danh sách đơn hàng đã mua."
            actionText="Đăng nhập ngay"
            onAction={() => openAuthModal('login')}
            icon={<ShoppingOutlined />}
          />
        </div>
      </ClientLayout>
    );
  }

  const isLoading = isUserLoading || isOrdersLoading;

  const tabItems = [
    { key: 'ALL', label: 'Tất cả' },
    { key: 'PENDING', label: 'Chờ xác nhận' },
    { key: 'CONFIRMED', label: 'Đã xác nhận' },
    { key: 'PROCESSING', label: 'Đang xử lý' },
    { key: 'COMPLETED', label: 'Đã giao' },
    { key: 'CANCELLED', label: 'Đã hủy' },
  ];

  const getStatusClass = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING':
      case 'AWAITING_PAYMENT':
        return styles.pending;
      case 'CONFIRMED':
        return styles.confirmed;
      case 'PROCESSING':
        return styles.processing;
      case 'COMPLETED':
      case 'PAID':
        return styles.completed;
      case 'CANCELLED':
        return styles.cancelled;
      default:
        return styles.pending;
    }
  };

  const getStatusText = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING':
        return 'Chờ xác nhận';
      case 'AWAITING_PAYMENT':
        return 'Chờ thanh toán';
      case 'CONFIRMED':
        return 'Đã duyệt';
      case 'PROCESSING':
        return 'Đang xử lý';
      case 'COMPLETED':
        return 'Hoàn thành';
      case 'PAID':
        return 'Đã thanh toán';
      case 'CANCELLED':
        return 'Đã hủy';
      case 'REFUND_REQUESTED':
        return 'Yêu cầu hoàn tiền';
      case 'REFUNDED':
        return 'Đã hoàn tiền';
      default:
        return status;
    }
  };

  // Lọc theo tab
  const filteredOrders = (orders || []).filter((o) => {
    if (activeTab === 'ALL') return true;
    return o.status === activeTab;
  });

  // Sắp xếp: Đơn mới nhất lên đầu (createdAt giảm dần hoặc id giảm dần)
  const sortedOrders = [...filteredOrders].sort((a, b) => {
    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    if (timeB !== timeA) return timeB - timeA;
    return Number(b.id) - Number(a.id);
  });

  // Xử lý xóa đơn hàng PENDING với xác nhận Modal
  const handleDeleteOrder = (orderId: number) => {
    modal.confirm({
      title: 'Xác nhận xóa đơn hàng',
      icon: <ExclamationCircleOutlined style={{ color: '#ef4444' }} />,
      content: (
        <div style={{ marginTop: 8 }}>
          <p style={{ marginBottom: 6, fontSize: 14 }}>
            Bạn có chắc chắn muốn xóa đơn hàng <strong>#{orderId}</strong> không?
          </p>
          <p style={{ color: '#6b7280', fontSize: 13, margin: 0 }}>
            Tồn kho của các sản phẩm sẽ được tự động hoàn lại. Thao tác này không thể hoàn tác.
          </p>
        </div>
      ),
      okText: 'Xóa đơn hàng',
      okType: 'danger',
      cancelText: 'Hủy bỏ',
      centered: true,
      async onOk() {
        setDeletingId(orderId);
        try {
          await orderApi.deleteOrder(orderId);
          message.success(`Đã xóa đơn hàng #${orderId} thành công`);
          await refetch();
        } catch (err: any) {
          const errMsg =
            err?.response?.data?.message || err?.message || 'Xóa đơn hàng thất bại';
          message.error(errMsg);
        } finally {
          setDeletingId(null);
        }
      },
    });
  };

  const columns: TableColumnsType<Order> = [
    {
      title: 'Mã đơn',
      dataIndex: 'id',
      key: 'id',
      width: 110,
      render: (id: number) => (
        <span
          className={styles.orderIdLink}
          onClick={() => router.push(`/orders/${id}`)}
          title="Xem chi tiết đơn hàng"
        >
          #{id}
        </span>
      ),
    },
    {
      title: 'Ngày đặt',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 140,
      render: (createdAt: string) => (
        <div className={styles.orderDateWrap}>
          <span className={styles.orderDateDay}>{formatDateOnly(createdAt)}</span>
          <span className={styles.orderDateTime}>{formatTimeOnly(createdAt)}</span>
        </div>
      ),
    },
    {
      title: 'Sản phẩm trong đơn',
      dataIndex: 'items',
      key: 'items',
      render: (items: any[]) => <OrderItemsCell items={items} productMap={productMap} />,
    },
    {
      title: 'Tổng tiền',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      width: 160,
      align: 'right',
      render: (amount: number) => (
        <span className={styles.totalCell}>
          {formatCurrency(amount || 0)}
        </span>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 150,
      align: 'center',
      render: (status: OrderStatus) => (
        <span className={`${styles.statusTag} ${getStatusClass(status)}`}>
          {getStatusText(status)}
        </span>
      ),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 120,
      align: 'center',
      render: (_, record: Order) => {
        const isPending = record.status === 'PENDING';
        const isDeleting = deletingId === record.id;

        return (
          <div className={styles.actionsWrap}>
            <Button
              type="primary"
              icon={<EyeOutlined />}
              title="Xem chi tiết"
              aria-label="Xem chi tiết"
              onClick={() => router.push(`/orders/${record.id}`)}
            />

            {isPending && (
              <Button
                danger
                icon={<DeleteOutlined />}
                title="Xóa đơn hàng"
                aria-label="Xóa đơn hàng"
                loading={isDeleting}
                onClick={() => handleDeleteOrder(record.id)}
              />
            )}
          </div>
        );
      },
    },
  ];

  return (
    <ClientLayout>
      <div className={styles.page}>
        <div className={styles.headerRow}>
          <h1 className={styles.title}>Đơn Hàng Của Tôi</h1>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => router.push('/orders/new')}
            style={{ borderRadius: 6, fontWeight: 600, height: 38 }}
          >
            Tạo đơn hàng mới
          </Button>
        </div>

        <div className={styles.tabsWrap}>
          <Tabs
            activeKey={activeTab}
            onChange={(key) => setActiveTab(key)}
            items={tabItems}
          />
        </div>

        {isLoading ? (
          <div className={styles.tableCard}>
            <Skeleton active paragraph={{ rows: 8 }} />
          </div>
        ) : sortedOrders.length === 0 ? (
          <div className={styles.tableCard}>
            <EmptyState
              title="Chưa có đơn hàng nào"
              description="Bạn chưa có đơn hàng nào trong mục này."
              actionText="Mua sắm ngay"
              onAction={() => router.push('/products')}
              icon={<ShoppingOutlined />}
            />
          </div>
        ) : (
          <div className={styles.tableCard}>
            <Table
              dataSource={sortedOrders}
              columns={columns}
              rowKey="id"
              scroll={{ x: 800 }}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                pageSizeOptions: ['5', '10', '20', '50'],
                showTotal: (total, range) =>
                  `Hiển thị ${range[0]}-${range[1]} trên tổng số ${total} đơn hàng`,
              }}
              locale={{ emptyText: 'Không tìm thấy đơn hàng nào' }}
            />
          </div>
        )}
      </div>
    </ClientLayout>
  );
}
