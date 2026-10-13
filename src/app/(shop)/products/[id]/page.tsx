"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { App, Breadcrumb, Button, Skeleton } from 'antd';
import {
  HomeOutlined,
  ShoppingCartOutlined,
  MinusOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import ClientLayout from '@/components/shared/ClientLayout';
import { EmptyState } from '@/components/shared/EmptyState/EmptyState';
import { useProductDetail } from '@/features/products/hooks';
import { useAddToCart } from '@/features/cart/hooks';
import { useCurrentUser } from '@/features/auth/hooks';
import { formatCurrency } from '@/lib/format';
import { useUIStore } from '@/stores/uiStore';
import styles from './product-detail.module.scss';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const { message } = App.useApp();
  const { data: user } = useCurrentUser();
  const { data: product, isLoading, isError } = useProductDetail(id);
  const { openAuthModal, triggerFlyEffect } = useUIStore();
  const addToCartMutation = useAddToCart();

  const [quantity, setQuantity] = useState<number>(1);
  const [imgSrc, setImgSrc] = useState<string>('');

  React.useEffect(() => {
    if (product?.imageUrl) {
      setImgSrc(product.imageUrl);
    } else {
      setImgSrc('/icon.png');
    }
  }, [product]);

  if (isLoading) {
    return (
      <ClientLayout>
        <div className={styles.page}>
          <Skeleton active paragraph={{ rows: 12 }} />
        </div>
      </ClientLayout>
    );
  }

  if (isError || !product) {
    return (
      <ClientLayout>
        <div className={styles.page}>
          <EmptyState
            title="Không tìm thấy sản phẩm"
            description="Sản phẩm bạn đang tìm kiếm có thể đã bị xóa hoặc không tồn tại."
            actionText="Quay lại danh sách sản phẩm"
            onAction={() => router.push('/products')}
          />
        </div>
      </ClientLayout>
    );
  }

  const stock = product.stock ?? 0;
  const isOutOfStock = product.status !== 'ACTIVE' || stock <= 0;

  const handleDecrease = () => {
    if (quantity > 1) {
      setQuantity((prev) => prev - 1);
    }
  };

  const handleIncrease = () => {
    if (quantity < stock && quantity < 99) {
      setQuantity((prev) => prev + 1);
    }
  };

  const handleAddToCart = (e: React.MouseEvent<HTMLElement>) => {
    if (!user) {
      message.warning('Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng');
      openAuthModal('login');
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    triggerFlyEffect({ x: rect.left + rect.width / 2, y: rect.top });

    addToCartMutation.mutate({
      productId: product.id,
      quantity,
    });
  };

  const breadcrumbItems = [
    {
      title: (
        <Link href="/">
          <HomeOutlined /> Trang chủ
        </Link>
      ),
    },
    {
      title: <Link href="/products">Sản phẩm</Link>,
    },
    {
      title: product.name,
    },
  ];

  return (
    <ClientLayout>
      <div className={styles.page}>
        <div className={styles.breadcrumbWrap}>
          <Breadcrumb items={breadcrumbItems} />
        </div>

        <div className={styles.detailGrid}>
          {/* Gallery / Image */}
          <div className={styles.gallerySection}>
            <div className={styles.mainImageWrap}>
              <img
                src={imgSrc}
                alt={product.name}
                onError={() => setImgSrc('/icon.png')}
              />
            </div>
          </div>

          {/* Product Info */}
          <div className={styles.infoSection}>
            <h1 className={styles.productTitle}>{product.name}</h1>

            <div className={styles.priceWrap}>
              <span className={styles.currentPrice}>
                {formatCurrency(product.price)}
              </span>
            </div>

            <div
              className={`${styles.stockStatus} ${
                isOutOfStock ? styles.outOfStock : styles.inStock
              }`}
            >
              Tình trạng:{' '}
              <span>{isOutOfStock ? 'Hết hàng' : `Còn hàng (${stock} sản phẩm)`}</span>
            </div>

            {/* Quantity Selector */}
            {!isOutOfStock && (
              <div className={styles.quantitySection}>
                <span className={styles.qtyLabel}>Số lượng:</span>
                <div className={styles.qtyControls}>
                  <button
                    type="button"
                    className={styles.qtyBtn}
                    onClick={handleDecrease}
                    disabled={quantity <= 1}
                  >
                    <MinusOutlined />
                  </button>
                  <span className={styles.qtyDisplay}>{quantity}</span>
                  <button
                    type="button"
                    className={styles.qtyBtn}
                    onClick={handleIncrease}
                    disabled={quantity >= stock || quantity >= 99}
                  >
                    <PlusOutlined />
                  </button>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className={styles.actionSection}>
              <Button
                type="primary"
                size="large"
                icon={<ShoppingCartOutlined />}
                className={styles.addToCartBtn}
                disabled={isOutOfStock}
                loading={addToCartMutation.isPending}
                onClick={handleAddToCart}
              >
                {isOutOfStock ? 'Hết hàng' : 'Thêm vào giỏ hàng'}
              </Button>
            </div>

            {/* Description */}
            <div className={styles.descSection}>
              <h3>Mô tả sản phẩm</h3>
              <p>
                Sản phẩm {product.name} chính hãng, đảm bảo tiêu chuẩn chất lượng cao và được bảo hành đầy đủ.
              </p>
            </div>
          </div>
        </div>
      </div>
    </ClientLayout>
  );
}
