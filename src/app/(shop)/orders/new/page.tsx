"use client";

import React, { useState, useEffect } from "react";
import {
  Typography,
  Select,
  InputNumber,
  Button,
  message,
  Row,
  Col,
  Divider,
  Empty,
  Input,
  Spin,
} from "antd";
import {
  ArrowLeftOutlined,
  DeleteOutlined,
  ArrowRightOutlined,
  SafetyCertificateOutlined,
  ShoppingOutlined,
  PlusOutlined,
  UserOutlined,
  TagOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { useThemeStore } from "@/store/themeStore";
import { useCartStore } from "@/store/cartStore";
import { apiClient } from "@/lib/api-client";
import Header from "@/components/ecommerce/Header";
import Footer from "@/components/ecommerce/Footer";
import styles from "./NewOrder.module.scss";

const { Text } = Typography;

interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  status: string;
  imageUrl?: string;
  specs?: string;
}

interface OrderItem {
  key: string;
  productId: number;
  name: string;
  price: number;
  quantity: number;
  stock: number;
  image?: string;
  specs?: string;
}

export default function CreateOrderPage() {
  const router = useRouter();
  const { isDarkMode } = useThemeStore();
  const { cart, clearCart, addToCart, removeFromCart } = useCartStore();

  const [user, setUser] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [addLineQty, setAddLineQty] = useState<number>(1);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) {
        message.warning("Vui lòng đăng nhập để tiến hành đặt hàng");
        router.push("/auth/login");
        return;
      }
      try {
        setLoadingUser(true);
        const meRes: any = await apiClient.get("/auth/me");
        const userData = meRes?.data || meRes;

        if (userData) {
          const custId = userData.customerId || userData.id;
          let customerInfo: any = null;
          if (custId) {
            try {
              const custRes: any = await apiClient.get(`/customers/${custId}`);
              customerInfo = custRes?.data || custRes;
            } catch (err) {
              console.error("Lỗi tải thông tin chi tiết khách hàng:", err);
            }
          }
          const combinedUser = { ...userData, ...(customerInfo || {}) };
          setUser(combinedUser);
        }
      } catch (e: any) {
        console.error("Failed to fetch user", e);
      } finally {
        setLoadingUser(false);
      }
    };

    fetchUser();
    fetchProducts();
  }, [router]);

  const fetchProducts = async () => {
    setLoadingProducts(true);
    try {
      const res = await fetch("/api/products?page=0&size=100");
      if (res.ok) {
        const json = await res.json();
        setProducts(json.data?.content || json.data || []);
      }
    } catch (e) {
      console.error("Failed to fetch products", e);
    } finally {
      setLoadingProducts(false);
    }
  };

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

  const handleAddLine = () => {
    if (!selectedProductId) {
      message.warning("Vui lòng chọn sản phẩm cần thêm");
      return;
    }
    const product = products.find((p) => p.id === selectedProductId);
    if (!product) return;

    if (addLineQty < 1 || addLineQty > 99) {
      message.error("Số lượng phải từ 1 đến 99");
      return;
    }

    addToCart({
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: addLineQty,
      image: product.imageUrl || "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?auto=format&fit=crop&w=400&q=80",
      specs: product.specs || "Chính hãng VNA",
    });

    message.success(`Đã thêm ${product.name} vào đơn đặt hàng`);
    setSelectedProductId(null);
    setAddLineQty(1);
  };

  const handleCreateOrder = async () => {
    try {
      if (cart.length === 0) {
        message.error("Đơn hàng phải có ít nhất 1 sản phẩm");
        return;
      }

      setSubmitting(true);
      const token = localStorage.getItem("token");

      const payload = {
        customerId: user?.customerId || user?.id,
        items: cart.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Tạo đơn hàng thất bại");
      }

      message.success("Tạo đơn hàng thành công!");
      clearCart();
      const createdOrder = Array.isArray(data.data) ? data.data[0] : data.data;
      router.push(`/orders/${createdOrder.id}`);
    } catch (error: any) {
      message.error(error.message || "Lỗi tạo đơn hàng");
    } finally {
      setSubmitting(false);
    }
  };

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const shipping = subtotal > 2000000 || subtotal === 0 ? 0 : 30000;
  const total = subtotal + shipping;

  return (
    <div className={`${styles.pageRoot} ${isDarkMode ? styles.darkMode : ""}`}>
      <Header />

      <main className={styles.main}>
        <div className={styles.container}>
          {/* Top navigation */}
          <div className={styles.topBar}>
            <button className={styles.backBtn} onClick={() => router.push("/#popular")}>
              <ArrowLeftOutlined />
              <span>Tiếp tục mua hàng</span>
            </button>
            <h1 className={styles.pageTitle}>
              Tạo đơn đặt hàng <span className={styles.itemCount}>({cart.length} sản phẩm)</span>
            </h1>
          </div>

          {/* Customer identification bar */}
          <div className={styles.customerCard}>
            <div className={styles.customerInfo}>
              <span className={styles.customerLabel}>
                <UserOutlined style={{ marginRight: 6 }} /> Khách hàng đặt mua:
              </span>
              <span className={styles.customerName}>
                {loadingUser ? (
                  <Spin size="small" />
                ) : user ? (
                  `${user.name || user.customerName || user.username || "Khách hàng"}${
                    user.email ? ` (${user.email})` : ""
                  }${user.phone ? ` - SĐT: ${user.phone}` : ""}`
                ) : (
                  "Khách vãng lai"
                )}
              </span>
            </div>

            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => {
                if (window.history.length > 1) router.back();
                else router.push("/");
              }}
            >
              Quay lại
            </Button>
          </div>

          {/* Quick Add Product Bar */}
          <div className={styles.addProductCard}>
            <div className={styles.addTitle}>Thêm nhanh sản phẩm vào đơn hàng</div>
            <Row gutter={16} align="middle">
              <Col xs={24} sm={12} md={14}>
                <Select
                  showSearch
                  placeholder="Tìm và chọn sản phẩm để thêm vào đơn..."
                  style={{ width: "100%" }}
                  value={selectedProductId}
                  onChange={setSelectedProductId}
                  loading={loadingProducts}
                  optionFilterProp="children"
                  size="large"
                >
                  {products.map((p) => {
                    const disabled = p.stock === 0 || p.status !== "ACTIVE";
                    return (
                      <Select.Option key={p.id} value={p.id} disabled={disabled}>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span>{p.name}</span>
                          <span style={{ color: "#1677ff", fontWeight: 600 }}>
                            {p.price?.toLocaleString("vi-VN")} đ
                          </span>
                        </div>
                      </Select.Option>
                    );
                  })}
                </Select>
              </Col>
              <Col xs={12} sm={6} md={5}>
                <InputNumber
                  min={1}
                  max={99}
                  style={{ width: "100%" }}
                  value={addLineQty}
                  onChange={(val) => setAddLineQty(val || 1)}
                  size="large"
                  addonBefore="SL"
                />
              </Col>
              <Col xs={12} sm={6} md={5}>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handleAddLine}
                  block
                  size="large"
                >
                  Thêm vào đơn
                </Button>
              </Col>
            </Row>
          </div>

          {/* Cart Items or Empty State */}
          {cart.length === 0 ? (
            <div className={styles.emptyCard}>
              <Empty
                image={<ShoppingOutlined style={{ fontSize: 72, color: "#BFBFBF" }} />}
                description={
                  <span className={styles.emptyDesc}>
                    Chưa có sản phẩm nào trong đơn hàng. Vui lòng chọn sản phẩm ở trên hoặc khám phá gian hàng!
                  </span>
                }
              >
                <Button
                  type="primary"
                  size="large"
                  shape="round"
                  onClick={() => router.push("/#popular")}
                >
                  Khám phá điện thoại ngay
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
                        src={
                          item.image ||
                          "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?auto=format&fit=crop&w=400&q=80"
                        }
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
                  <h2 className={styles.summaryTitle}>Tóm tắt thanh toán</h2>

                  <div className={styles.summaryItem}>
                    <span className={styles.label}>Tạm tính ({cart.length} món)</span>
                    <span className={styles.value}>
                      {subtotal.toLocaleString("vi-VN")} đ
                    </span>
                  </div>

                  <div className={styles.summaryItem}>
                    <span className={styles.label}>Phí giao hàng</span>
                    <span className={styles.value}>
                      {shipping === 0 ? "MIỄN PHÍ" : `${shipping.toLocaleString("vi-VN")} đ`}
                    </span>
                  </div>

                  <div className={styles.promoWrap}>
                    <Input
                      placeholder="Mã ưu đãi (ví dụ: ECOMMERCE)"
                      prefix={<TagOutlined style={{ color: "#8C8C8C" }} />}
                      className={styles.promoInput}
                    />
                    <Button onClick={() => message.success("Đã kích hoạt ưu đãi!")}>
                      Áp dụng
                    </Button>
                  </div>

                  <Divider style={{ margin: "16px 0" }} />

                  <div className={styles.totalRow}>
                    <span className={styles.totalLabel}>Tổng đơn hàng</span>
                    <span className={styles.totalValue}>
                      {total.toLocaleString("vi-VN")} đ
                    </span>
                  </div>

                  {/* Submit create order to backend API */}
                  <Button
                    type="primary"
                    size="large"
                    block
                    className={styles.checkoutBtn}
                    icon={<ArrowRightOutlined />}
                    iconPosition="end"
                    loading={submitting}
                    onClick={handleCreateOrder}
                  >
                    Xác nhận & Tạo đơn
                  </Button>

                  <div className={styles.guaranteeNote}>
                    <SafetyCertificateOutlined style={{ color: "#52c41a", fontSize: 16 }} />
                    <span>Cam kết bảo hành chính hãng & Đổi trả trong 30 ngày</span>
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
