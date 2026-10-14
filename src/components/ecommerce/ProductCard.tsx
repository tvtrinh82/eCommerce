"use client";

import React, { useState } from "react";
import { Tag, Rate, Button, message } from "antd";
import { HeartOutlined, HeartFilled, ShoppingCartOutlined, EyeOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { Product } from "@/types";
import { useCartStore } from "@/store/cartStore";
import styles from "./ProductCard.module.scss";

interface ProductCardProps {
  product: Product;
  badgeType?: "best-seller" | "discount" | "tag";
}

export default function ProductCard({ product, badgeType = "tag" }: ProductCardProps) {
  const router = useRouter();
  const { addToCart } = useCartStore();
  const [isWishlisted, setIsWishlisted] = useState(false);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      message.warning("Vui lòng đăng nhập để sử dụng giỏ hàng!");
      router.push("/auth/login");
      return;
    }

    addToCart({
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      image: product.imageUrl,
      specs: product.specs,
    });
    message.success(`Đã thêm ${product.name} vào giỏ hàng!`);
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsWishlisted(!isWishlisted);
    if (!isWishlisted) {
      message.info(`Đã thêm vào danh sách yêu thích`);
    } else {
      message.info(`Đã xóa khỏi danh sách yêu thích`);
    }
  };

  return (
    <div
      className={styles.card}
      onClick={() => router.push(`/products/${product.id}`)}
    >
      <div className={styles.cardHeader}>
        {product.discountPercent ? (
          <span className={styles.discountBadge}>-{product.discountPercent}%</span>
        ) : product.tag ? (
          <span className={styles.tagBadge}>{product.tag}</span>
        ) : (
          <span />
        )}

        <button
          className={`${styles.wishlistBtn} ${isWishlisted ? styles.activeWishlist : ""}`}
          onClick={handleToggleWishlist}
          title="Thêm vào yêu thích"
        >
          {isWishlisted ? (
            <HeartFilled style={{ color: "#ff4d4f" }} />
          ) : (
            <HeartOutlined />
          )}
        </button>
      </div>

      <div className={styles.imageContainer}>
        <img
          src={product.imageUrl}
          alt={product.name}
          className={styles.productImage}
          loading="lazy"
        />
        <div className={styles.quickViewOverlay}>
          <Button
            shape="round"
            icon={<EyeOutlined />}
            size="small"
            className={styles.btnQuickView}
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/products/${product.id}`);
            }}
          >
            Xem nhanh
          </Button>
        </div>
      </div>

      <div className={styles.cardBody}>
        <div className={styles.brandModelRow}>
          <span className={styles.brandText}>{product.brand}</span>
          <span className={styles.specsText}>{product.specs}</span>
        </div>

        <h3 className={styles.productTitle} title={product.name}>
          {product.name}
        </h3>

        <div className={styles.ratingRow}>
          <Rate disabled defaultValue={product.rating} allowHalf className={styles.rateStars} />
          <span className={styles.reviewsCount}>({product.reviewsCount} đánh giá)</span>
        </div>

        <div className={styles.priceActionRow}>
          <div className={styles.priceWrap}>
            <span className={styles.currentPrice}>
              {product.price.toLocaleString("vi-VN")} đ
            </span>
            {product.oldPrice && (
              <span className={styles.oldPrice}>
                {product.oldPrice.toLocaleString("vi-VN")} đ
              </span>
            )}
          </div>

          <Button
            type="primary"
            shape="round"
            icon={<ShoppingCartOutlined />}
            className={styles.btnAddToCart}
            onClick={handleAddToCart}
          >
            Thêm
          </Button>
        </div>
      </div>
    </div>
  );
}
