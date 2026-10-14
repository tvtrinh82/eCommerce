"use client";

import React from "react";
import { Drawer, Button, Empty, Divider } from "antd";
import {
  DeleteOutlined,
  ShoppingOutlined,
  ArrowRightOutlined,
  SafetyCertificateOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/cartStore";
import styles from "./CartDrawer.module.scss";

export default function CartDrawer() {
  const router = useRouter();
  const { cart, isCartVisible, setCartVisible, removeFromCart, addToCart } = useCartStore();

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const shipping = subtotal > 99 || subtotal === 0 ? 0 : 15;
  const total = subtotal + shipping;

  const handleUpdateQuantity = (productId: number, newQty: number, item: any) => {
    if (newQty <= 0) {
      removeFromCart(productId);
      return;
    }
    const diff = newQty - item.quantity;
    if (diff !== 0) {
      addToCart({ ...item, quantity: diff });
    }
  };

  return (
    <Drawer
      title={
        <div className={styles.drawerTitle}>
          <span>Giỏ hàng của bạn</span>
          <span className={styles.itemCountBadge}>({cart.length})</span>
        </div>
      }
      placement="right"
      width={420}
      onClose={() => setCartVisible(false)}
      open={isCartVisible}
      className={styles.drawer}
      styles={{ body: { padding: 0 } }}
    >
      <div className={styles.drawerBody}>
        {cart.length === 0 ? (
          <div className={styles.emptyContainer}>
            <Empty
              image={<ShoppingOutlined style={{ fontSize: 64, color: "#BFBFBF" }} />}
              description={
                <span className={styles.emptyText}>Giỏ hàng của bạn đang trống</span>
              }
            >
              <Button
                type="primary"
                shape="round"
                onClick={() => {
                  setCartVisible(false);
                  router.push("/#popular");
                }}
              >
                Khám phá điện thoại ngay
              </Button>
            </Empty>
          </div>
        ) : (
          <>
            <div className={styles.freeShippingNotice}>
              <span className={styles.freeShippingSuccess}>
                🎉 Chúc mừng! Bạn được <strong>Miễn phí vận chuyển toàn quốc</strong>!
              </span>
            </div>

            <div className={styles.itemsList}>
              {cart.map((item) => (
                <div key={item.productId} className={styles.cartItemCard}>
                  <img
                    src={item.image}
                    alt={item.name}
                    className={styles.itemImage}
                  />

                  <div className={styles.itemDetails}>
                    <div className={styles.itemHeader}>
                      <h4 className={styles.itemName} title={item.name}>
                        {item.name}
                      </h4>
                      <button
                        className={styles.btnDelete}
                        onClick={() => removeFromCart(item.productId)}
                        title="Xóa sản phẩm"
                      >
                        <DeleteOutlined />
                      </button>
                    </div>

                    {item.specs && (
                      <span className={styles.itemSpecs}>{item.specs}</span>
                    )}

                    <div className={styles.priceStepperRow}>
                      <span className={styles.itemPrice}>
                        {item.price.toLocaleString("vi-VN")} đ
                      </span>

                      <div className={styles.quantityControls}>
                        <button
                          className={styles.stepBtn}
                          onClick={() =>
                            handleUpdateQuantity(item.productId, item.quantity - 1, item)
                          }
                        >
                          -
                        </button>
                        <span className={styles.qtyVal}>{item.quantity}</span>
                        <button
                          className={styles.stepBtn}
                          onClick={() =>
                            handleUpdateQuantity(item.productId, item.quantity + 1, item)
                          }
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.footerSummary}>
              <div className={styles.summaryRow}>
                <span className={styles.label}>Tạm tính</span>
                <span className={styles.val}>
                  {subtotal.toLocaleString("vi-VN")} đ
                </span>
              </div>
              <div className={styles.summaryRow}>
                <span className={styles.label}>Phí giao hàng</span>
                <span className={styles.val}>
                  MIỄN PHÍ
                </span>
              </div>
              <Divider style={{ margin: "10px 0" }} />
              <div className={styles.totalRow}>
                <span className={styles.totalLabel}>Tổng thanh toán</span>
                <span className={styles.totalVal}>
                  {subtotal.toLocaleString("vi-VN")} đ
                </span>
              </div>

              <Button
                type="primary"
                size="large"
                block
                className={styles.btnCheckout}
                icon={<ArrowRightOutlined />}
                iconPosition="end"
                onClick={() => {
                  setCartVisible(false);
                  router.push("/orders/new");
                }}
              >
                Tiến hành đặt hàng
              </Button>

              <div className={styles.securityTag}>
                <SafetyCertificateOutlined style={{ color: "#52c41a" }} />
                <span>Bảo mật thanh toán SSL 256-bit & Đổi trả trong 30 ngày</span>
              </div>
            </div>
          </>
        )}
      </div>
    </Drawer>
  );
}
