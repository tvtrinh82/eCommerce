"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { App, Button, Popconfirm, Skeleton, Checkbox } from 'antd';
import {
  DeleteOutlined,
  MinusOutlined,
  PlusOutlined,
  ShoppingCartOutlined,
  ArrowLeftOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import ClientLayout from '@/components/shared/ClientLayout';
import { EmptyState } from '@/components/shared/EmptyState/EmptyState';
import { useCart, useUpdateCartItem, useRemoveCartItem, useClearCart } from '@/features/cart/hooks';
import { useCurrentUser } from '@/features/auth/hooks';
import { useCreateOrder } from '@/features/orders/hooks';
import { formatCurrency } from '@/lib/format';
import { useUIStore } from '@/stores/uiStore';
import styles from './cart.module.scss';

export default function CartPage() {
  const router = useRouter();
  const { openAuthModal } = useUIStore();
  const { message } = App.useApp();

  const [isMounted, setIsMounted] = useState(false);
  const { data: user, isLoading: isUserLoading } = useCurrentUser();
  const { data: cart, isLoading: isCartLoading } = useCart();
  const updateCartItemMutation = useUpdateCartItem();
  const removeCartItemMutation = useRemoveCartItem();
  const clearCartMutation = useClearCart();
  const createOrderMutation = useCreateOrder();

  const items = cart?.items || [];
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Tự động chọn tất cả sản phẩm ban đầu hoặc đồng bộ khi giỏ thay đổi
  useEffect(() => {
    if (items.length > 0) {
      setSelectedProductIds((prev) => {
        if (prev.length === 0) {
          return items.map((i) => i.productId);
        }
        const valid = prev.filter((id) => items.some((i) => i.productId === id));
        return valid.length > 0 ? valid : items.map((i) => i.productId);
      });
    } else {
      setSelectedProductIds([]);
    }
  }, [items]);

  const handleSelectAll = (e: any) => {
    if (e.target.checked) {
      setSelectedProductIds(items.map((i) => i.productId));
    } else {
      setSelectedProductIds([]);
    }
  };

  const handleToggleProduct = (productId: number, checked: boolean) => {
    if (checked) {
      setSelectedProductIds((prev) => [...prev, productId]);
    } else {
      setSelectedProductIds((prev) => prev.filter((id) => id !== productId));
    }
  };

  const selectedItems = items.filter((i) => selectedProductIds.includes(i.productId));
  const selectedAmount = selectedItems.reduce(
    (sum, item) => sum + (item.subtotal ?? (item.price * item.quantity)),
    0
  );

  const handleUpdateQty = (productId: number, currentQty: number, delta: number) => {
    const nextQty = currentQty + delta;
    if (nextQty <= 0) return;
    updateCartItemMutation.mutate({
      productId,
      request: { quantity: nextQty },
    });
  };

  const handleRemove = (productId: number) => {
    removeCartItemMutation.mutate(productId);
  };

  const handleCheckout = () => {
    if (!user || !user.customerId) {
      message.error('Không tìm thấy thông tin tài khoản khách hàng để đặt hàng.');
      return;
    }

    if (selectedItems.length === 0) {
      message.warning('Vui lòng tích chọn ít nhất 1 sản phẩm để tiến hành đặt hàng');
      return;
    }

    // Đưa danh sách sản phẩm đã tick chọn vào sessionStorage để chuyển sang trang /orders/new
    const checkoutItems = selectedItems.map((item) => ({
      productId: item.productId,
      name: item.productName,
      price: item.price,
      stock: item.stock,
      quantity: item.quantity,
      imageUrl: item.imageUrl,
    }));

    try {
      sessionStorage.setItem('order_checkout_items', JSON.stringify(checkoutItems));
    } catch (e) {
      console.error(e);
    }

    router.push('/orders/new');
  };

  const isAllSelected = items.length > 0 && selectedProductIds.length === items.length;
  const isIndeterminate = selectedProductIds.length > 0 && selectedProductIds.length < items.length;

  // Đang load → Skeleton, không vội kết luận chưa đăng nhập
  if (!isMounted || isUserLoading || isCartLoading) {
    return (
      <ClientLayout>
        <div className={styles.page}>
          <h1 className={styles.title}>Giỏ Hàng Của Bạn</h1>
          <Skeleton active paragraph={{ rows: 8 }} />
        </div>
      </ClientLayout>
    );
  }

  // Query đã xong mà không có user → chưa đăng nhập
  if (!user) {
    return (
      <ClientLayout>
        <div className={styles.page}>
          <h1 className={styles.title}>Giỏ Hàng Của Bạn</h1>
          <EmptyState
            title="Bạn chưa đăng nhập"
            description="Vui lòng đăng nhập để xem các sản phẩm trong giỏ hàng của bạn."
            actionText="Đăng nhập ngay"
            onAction={() => openAuthModal('login')}
            icon={<ShoppingCartOutlined />}
          />
        </div>
      </ClientLayout>
    );
  }

  if (user.role !== 'USER') {
    return (
      <ClientLayout>
        <div className={styles.page}>
          <h1 className={styles.title}>Giỏ Hàng Của Bạn</h1>
          <EmptyState
            title="Tài khoản này không sử dụng được giỏ hàng"
            description="Giỏ hàng chỉ dành cho tài khoản khách hàng (USER)."
            actionText="Tiếp tục mua sắm"
            onAction={() => router.push('/products')}
            icon={<ShoppingCartOutlined />}
          />
        </div>
      </ClientLayout>
    );
  }

  return (
    <ClientLayout>
      <div className={styles.page}>
        <h1 className={styles.title}>Giỏ Hàng Của Bạn</h1>

        {items.length === 0 ? (
          <EmptyState
            title="Giỏ hàng trống"
            description="Chưa có sản phẩm nào trong giỏ hàng của bạn."
            actionText="Khám phá sản phẩm ngay"
            onAction={() => router.push('/products')}
            icon={<ShoppingCartOutlined />}
          />
        ) : (
          <div className={styles.cartLayout}>
            {/* Items Table */}
            <div className={styles.itemList}>
              {/* Thanh chọn tất cả trên Mobile */}
              <div className={styles.mobileSelectAllBar}>
                <Checkbox
                  checked={isAllSelected}
                  indeterminate={isIndeterminate}
                  onChange={handleSelectAll}
                >
                  Chọn tất cả ({selectedItems.length}/{items.length} sản phẩm)
                </Checkbox>
              </div>

              <div className={styles.itemHeader}>
                <div className={styles.headerCheckboxWrap}>
                  <Checkbox
                    checked={isAllSelected}
                    indeterminate={isIndeterminate}
                    onChange={handleSelectAll}
                    title="Chọn tất cả"
                  />
                </div>
                <span>Sản phẩm</span>
                <span>Đơn giá</span>
                <span>Số lượng</span>
                <span>Thành tiền</span>
                <span />
              </div>

              {items.map((item) => {
                const isChecked = selectedProductIds.includes(item.productId);
                return (
                  <div key={item.id} className={styles.itemRow}>
                    {/* Tickbox chọn sản phẩm */}
                    <div className={styles.rowCheckboxWrap}>
                      <Checkbox
                        checked={isChecked}
                        onChange={(e) => handleToggleProduct(item.productId, e.target.checked)}
                        aria-label={`Chọn sản phẩm ${item.productName}`}
                      />
                    </div>

                    {/* Product Info */}
                    <div className={styles.productInfo}>
                      <img
                        src={item.imageUrl || '/icon.png'}
                        alt={item.productName}
                        className={styles.productImage}
                        onClick={() => router.push(`/products/${item.productId}`)}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/icon.png';
                        }}
                      />
                      <div
                        className={styles.productName}
                        onClick={() => router.push(`/products/${item.productId}`)}
                      >
                        {item.productName}
                      </div>
                    </div>

                    {/* Unit Price */}
                    <div className={styles.unitPrice}>
                      {formatCurrency(item.price)}
                    </div>

                    {/* Quantity Controls */}
                    <div className={styles.qtyControls}>
                      <button
                        type="button"
                        className={styles.qtyBtn}
                        disabled={item.quantity <= 1 || updateCartItemMutation.isPending}
                        onClick={() => handleUpdateQty(item.productId, item.quantity, -1)}
                      >
                        <MinusOutlined />
                      </button>
                      <span className={styles.qtyValue}>{item.quantity}</span>
                      <button
                        type="button"
                        className={styles.qtyBtn}
                        disabled={item.quantity >= item.stock || item.quantity >= 99 || updateCartItemMutation.isPending}
                        onClick={() => handleUpdateQty(item.productId, item.quantity, 1)}
                      >
                        <PlusOutlined />
                      </button>
                    </div>

                    {/* Subtotal */}
                    <div className={styles.subtotal}>
                      {formatCurrency(item.subtotal)}
                    </div>

                    {/* Delete Button */}
                    <Popconfirm
                      title="Xóa sản phẩm này khỏi giỏ hàng?"
                      okText="Xóa"
                      cancelText="Hủy"
                      onConfirm={() => handleRemove(item.productId)}
                    >
                      <button
                        type="button"
                        className={styles.deleteBtn}
                        aria-label="Xóa sản phẩm"
                      >
                        <DeleteOutlined />
                      </button>
                    </Popconfirm>
                  </div>
                );
              })}
            </div>

            {/* Summary Card */}
            <div className={styles.summaryCard}>
              <h2 className={styles.summaryTitle}>Tóm Tắt Đơn Hàng</h2>

              <div className={styles.summaryRow}>
                <span>Tổng sản phẩm đã chọn:</span>
                <span className={styles.summaryValue}>
                  {selectedItems.length} / {items.length} sản phẩm
                </span>
              </div>

              <div className={styles.divider} />

              <div className={styles.totalRow}>
                <span className={styles.totalLabel}>Tổng cộng:</span>
                <span className={styles.totalAmount}>
                  {formatCurrency(selectedAmount)}
                </span>
              </div>

              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                className={styles.checkoutBtn}
                disabled={selectedItems.length === 0}
                onClick={handleCheckout}
              >
                Tiến hành đặt hàng ({selectedItems.length})
              </Button>

              <Button
                icon={<ArrowLeftOutlined />}
                className={styles.continueBtn}
                onClick={() => router.push('/products')}
              >
                Tiếp tục mua sắm
              </Button>
            </div>
          </div>
        )}
      </div>
    </ClientLayout>
  );
}
