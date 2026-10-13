"use client";

import React, { useState, useEffect } from 'react';
import { Modal, Button, App } from 'antd';
import { MinusOutlined, PlusOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import { useUIStore } from '@/stores/uiStore';
import { useAddToCart } from '../../hooks';
import { useCurrentUser } from '@/features/auth/hooks';
import { formatCurrency } from '@/lib/format';
import styles from './AddToCartModal.module.scss';

export function AddToCartModal() {
  const {
    isAddToCartModalOpen,
    selectedProductForCart,
    closeAddToCartModal,
    openAuthModal,
    triggerFlyEffect,
  } = useUIStore();

  const { message } = App.useApp();
  const { data: user } = useCurrentUser();
  const [quantity, setQuantity] = useState<number>(1);
  const addToCartMutation = useAddToCart();

  useEffect(() => {
    if (isAddToCartModalOpen) {
      setQuantity(1);
    }
  }, [isAddToCartModalOpen]);

  if (!selectedProductForCart) {
    return null;
  }

  const product = selectedProductForCart;
  const maxStock = product.stock ?? 99;
  const isOutOfStock = maxStock <= 0;
  const totalPrice = product.price * quantity;

  const handleDecrease = () => {
    if (quantity > 1) {
      setQuantity((prev) => prev - 1);
    }
  };

  const handleIncrease = () => {
    if (quantity < maxStock && quantity < 99) {
      setQuantity((prev) => prev + 1);
    }
  };

  const handleConfirm = (event: React.MouseEvent<HTMLElement>) => {
    if (!user) {
      message.warning('Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng');
      closeAddToCartModal();
      openAuthModal('login');
      return;
    }

    if (user.role !== 'USER') {
      message.error('Chỉ tài khoản khách hàng (USER) mới được sử dụng giỏ hàng.');
      closeAddToCartModal();
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    triggerFlyEffect({ x: rect.left + rect.width / 2, y: rect.top });

    addToCartMutation.mutate(
      { productId: product.id, quantity },
      {
        onSuccess: () => {
          closeAddToCartModal();
        },
      }
    );
  };

  return (
    <Modal
      open={isAddToCartModalOpen}
      onCancel={closeAddToCartModal}
      footer={null}
      width={440}
      centered
      className={styles.modalWrap}
      title="Thêm vào giỏ hàng"
    >
      <div className={styles.modalContent}>
        <div className={styles.productHeader}>
          <div className={styles.imageWrap}>
            <img
              src={product.imageUrl || '/icon.png'}
              alt={product.name}
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/icon.png';
              }}
            />
          </div>
          <div className={styles.infoWrap}>
            <h3 className={styles.productName}>{product.name}</h3>
            <div className={styles.productPrice}>{formatCurrency(product.price)}</div>
            <div
              className={`${styles.stockBadge} ${isOutOfStock ? styles.outOfStock : ''}`}
            >
              {isOutOfStock ? (
                'Hết hàng'
              ) : (
                <>
                  Tồn kho: <span>{maxStock}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className={styles.quantitySection}>
          <span className={styles.quantityLabel}>Số lượng</span>
          <div className={styles.quantityControls}>
            <button
              type="button"
              className={styles.qtyBtn}
              onClick={handleDecrease}
              disabled={quantity <= 1 || isOutOfStock}
            >
              <MinusOutlined />
            </button>
            <span className={styles.qtyValue}>{quantity}</span>
            <button
              type="button"
              className={styles.qtyBtn}
              onClick={handleIncrease}
              disabled={quantity >= maxStock || quantity >= 99 || isOutOfStock}
            >
              <PlusOutlined />
            </button>
          </div>
        </div>

        <div className={styles.totalRow}>
          <span className={styles.totalLabel}>Tạm tính:</span>
          <span className={styles.totalAmount}>{formatCurrency(totalPrice)}</span>
        </div>

        <div className={styles.actionRow}>
          <Button className={styles.cancelBtn} onClick={closeAddToCartModal}>
            Hủy
          </Button>
          <Button
            type="primary"
            icon={<ShoppingCartOutlined />}
            className={styles.confirmBtn}
            disabled={isOutOfStock}
            loading={addToCartMutation.isPending}
            onClick={handleConfirm}
          >
            {isOutOfStock ? 'Hết hàng' : 'Xác nhận thêm'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
