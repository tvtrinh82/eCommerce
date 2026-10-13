"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from 'antd';
import { ShoppingCartOutlined, EyeOutlined } from '@ant-design/icons';
import { Product } from '@/features/products/types';
import { formatCurrency } from '@/lib/format';
import { useUIStore } from '@/stores/uiStore';
import styles from './ProductCard.module.scss';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const router = useRouter();
  const { openAddToCartModal } = useUIStore();
  const [imgSrc, setImgSrc] = useState<string>(product.imageUrl || '/icon.png');

  const isOutOfStock = product.status !== 'ACTIVE' || (product.stock ?? 0) <= 0;

  const handleGoDetail = () => {
    router.push(`/products/${product.id}`);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    openAddToCartModal({
      id: product.id,
      name: product.name,
      price: product.price,
      stock: product.stock,
      imageUrl: product.imageUrl || undefined,
      status: product.status,
    });
  };

  return (
    <div className={styles.card}>
      <div className={styles.imageWrap} onClick={handleGoDetail}>
        <img
          src={imgSrc}
          alt={product.name}
          className={styles.img}
          onError={() => setImgSrc('/icon.png')}
          loading="lazy"
        />
        <div
          className={`${styles.stockTag} ${
            isOutOfStock ? styles.outOfStock : styles.inStock
          }`}
        >
          {isOutOfStock ? 'Hết hàng' : 'Còn hàng'}
        </div>
      </div>

      <div className={styles.body}>
        <h3 className={styles.title} onClick={handleGoDetail} title={product.name}>
          {product.name}
        </h3>

        <div className={styles.priceWrap}>
          <div className={styles.price}>{formatCurrency(product.price)}</div>
        </div>

        <div className={styles.actions}>
          <Button
            icon={<EyeOutlined />}
            className={styles.viewBtn}
            onClick={handleGoDetail}
            title="Xem chi tiết"
          >
            <span>Chi tiết</span>
          </Button>

          <Button
            type="primary"
            icon={<ShoppingCartOutlined />}
            className={styles.cartBtn}
            disabled={isOutOfStock}
            onClick={handleAddToCart}
            title="Thêm vào giỏ hàng"
          >
            <span>Thêm giỏ</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
