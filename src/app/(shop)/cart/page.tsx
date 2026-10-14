"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Row, Col, Divider, Empty, Input, message } from "antd";
import {
  ArrowLeftOutlined,
  DeleteOutlined,
  ArrowRightOutlined,
  SafetyCertificateOutlined,
  ShoppingOutlined,
  TagOutlined,
} from "@ant-design/icons";
import Header from "@/components/ecommerce/Header";
import Footer from "@/components/ecommerce/Footer";
import { useCartStore } from "@/store/cartStore";
import styles from "./Cart.module.scss";

export default function CartPage() {
  const router = useRouter();
  const { cart, removeFromCart, addToCart } = useCartStore();

  React.useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      message.warning("Vui lòng đăng nhập để xem giỏ hàng của bạn");
      router.push("/auth/login");
    }
  }, [router]);

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const shipping = subtotal > 2000000 || subtotal === 0 ? 0 : 30000;
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
    <div className={styles.pageRoot}>
      <Header />

      <main className={styles.main}>
        <div className={styles.container}>
          <div className={styles.topBar}>
            <button className={styles.backBtn} onClick={() => router.back()}>
              <ArrowLeftOutlined />
              <span>Tiếp tục mua hàng</span>
            </button>
            <h1 className={styles.pageTitle}>
              Giỏ hàng của bạn <span className={styles.itemCount}>({cart.length} sản phẩm)</span>
            </h1>
          </div>

          {cart.length === 0 ? (
            <div className={styles.emptyCard}>
              <Empty
                image={<ShoppingOutlined style={{ fontSize: 72, color: "#BFBFBF" }} />}
                description={
                  <span className={styles.emptyDesc}>
                    Giỏ hàng của bạn đang trống. Hãy khám phá các thiết bị flagship mới nhất!
                  </span>
                }
              >
                <Button
                  type="primary"
                  size="large"
                  shape="round"
                  onClick={() => router.push("/#popular")}
                >
                  Khám phá sản phẩm
                </Button>
              </Empty>
            </div>
          ) : (
            <Row gutter={[32, 32]}>
              <Col xs={24} lg={16}>
                <div className={styles.itemsWrapper}>
                  {cart.map((item) => (
                    <div key={item.productId} className={styles.cartCard}>
                      <img
                        src={item.image}
                        alt={item.name}
                        className={styles.productImg}
                      />

                      <div className={styles.productInfo}>
                        <div className={styles.productTop}>
                          <div>
                            <h3 className={styles.productName}>{item.name}</h3>
                            {item.specs && (
                              <span className={styles.productSpecs}>{item.specs}</span>
                            )}
                          </div>
                          <button
                            className={styles.deleteBtn}
                            onClick={() => removeFromCart(item.productId)}
                            title="Xóa sản phẩm"
                          >
                            <DeleteOutlined />
                          </button>
                        </div>

                        <div className={styles.bottomRow}>
                          <span className={styles.price}>
                            {item.price.toLocaleString("vi-VN")} đ
                          </span>

                          <div className={styles.stepper}>
                            <button
                              className={styles.stepBtn}
                              onClick={() =>
                                handleUpdateQuantity(item.productId, item.quantity - 1, item)
                              }
                            >
                              -
                            </button>
                            <span className={styles.qtyText}>{item.quantity}</span>
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
              </Col>

              <Col xs={24} lg={8}>
                <div className={styles.summaryCard}>
                  <h2 className={styles.summaryTitle}>Tóm tắt đơn hàng</h2>

                  <div className={styles.summaryItem}>
                    <span className={styles.label}>Tạm tính</span>
                    <span className={styles.value}>
                      {subtotal.toLocaleString("vi-VN")} đ
                    </span>
                  </div>

                  <div className={styles.summaryItem}>
                    <span className={styles.label}>Phí vận chuyển</span>
                    <span className={styles.value}>
                      {shipping === 0 ? "MIỄN PHÍ" : `${shipping.toLocaleString("vi-VN")} đ`}
                    </span>
                  </div>

                  <div className={styles.promoWrap}>
                    <Input
                      placeholder="Mã giảm giá (ví dụ: ECOMMERCE)"
                      prefix={<TagOutlined style={{ color: "#8C8C8C" }} />}
                      className={styles.promoInput}
                    />
                    <Button onClick={() => message.success("Đã áp dụng mã ưu đãi!")}>
                      Áp dụng
                    </Button>
                  </div>

                  <Divider style={{ margin: "16px 0" }} />

                  <div className={styles.totalRow}>
                    <span className={styles.totalLabel}>Tổng cộng</span>
                    <span className={styles.totalValue}>
                      {total.toLocaleString("vi-VN")} đ
                    </span>
                  </div>

                  {/* Chuyển thẳng tới trang tạo đơn hàng backend thật: /orders/new */}
                  <Button
                    type="primary"
                    size="large"
                    block
                    className={styles.checkoutBtn}
                    icon={<ArrowRightOutlined />}
                    iconPosition="end"
                    onClick={() => router.push("/orders/new")}
                  >
                    Tiến hành đặt hàng
                  </Button>

                  <div className={styles.guaranteeNote}>
                    <SafetyCertificateOutlined style={{ color: "#52c41a", fontSize: 16 }} />
                    <span>Bảo hành chính hãng 100% & Đổi trả trong 30 ngày</span>
                  </div>
                </div>
              </Col>
            </Row>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
