"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Row,
  Col,
  Rate,
  Button,
  Tag,
  Divider,
  Breadcrumb,
  message,
  Spin,
  Alert,
} from "antd";
import {
  ArrowLeftOutlined,
  ShareAltOutlined,
  HeartOutlined,
  HeartFilled,
  ShoppingCartOutlined,
  SafetyCertificateOutlined,
  SyncOutlined,
  TruckOutlined,
  CheckOutlined,
} from "@ant-design/icons";
import Header from "@/components/ecommerce/Header";
import Footer from "@/components/ecommerce/Footer";
import CartDrawer from "@/components/ecommerce/CartDrawer";
import { useCartStore } from "@/store/cartStore";
import { apiClient } from "@/lib/api-client";
import { formatCurrency } from "@/lib/format";
import styles from "./ProductDetail.module.scss";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { addToCart, setCartVisible } = useCartStore();

  const productId = Number(params?.id);
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [activeImage, setActiveImage] = useState<string>("");
  const [selectedStorage, setSelectedStorage] = useState<string>("256GB");
  const [selectedColor, setSelectedColor] = useState<string>("#2C3E50");
  const [quantity, setQuantity] = useState<number>(1);
  const [isWishlisted, setIsWishlisted] = useState<boolean>(false);

  // Fetch dữ liệu thật từ Backend API
  useEffect(() => {
    const fetchProduct = async () => {
      if (!productId) return;
      try {
        setLoading(true);
        setErrorMsg(null);
        // Fallback an toàn: Thử lấy danh sách nếu /products/{id} có lỗi cache Redis BE
        const res: any = await apiClient.get("/products?page=0&size=100");
        const list = res.data?.content || res.data || [];
        const found = list.find((p: any) => p.id === productId);

        if (found) {
          setProduct(found);
          setActiveImage(found.imageUrl || "https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=600&q=80");
        } else {
          // Thử gọi trực tiếp /products/{id}
          const detailRes: any = await apiClient.get(`/products/${productId}`);
          const p = detailRes.data?.data || detailRes.data;
          if (p) {
            setProduct(p);
            setActiveImage(p.imageUrl || "https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=600&q=80");
          } else {
            setErrorMsg("Không tìm thấy sản phẩm");
          }
        }
      } catch (err: any) {
        console.error("Lỗi khi tải chi tiết sản phẩm:", err);
        setErrorMsg("Không thể tải thông tin sản phẩm từ máy chủ");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  if (loading) {
    return (
      <div className={styles.pageRoot}>
        <Header />
        <div style={{ padding: "120px 0", textAlign: "center" }}>
          <Spin size="large" tip="Đang tải chi tiết sản phẩm..." />
        </div>
        <Footer />
      </div>
    );
  }

  if (errorMsg || !product) {
    return (
      <div className={styles.pageRoot}>
        <Header />
        <div style={{ maxWidth: 600, margin: "80px auto", padding: "0 20px" }}>
          <Alert
            message="Thông báo"
            description={errorMsg || "Sản phẩm không tồn tại hoặc đã ngừng kinh doanh."}
            type="warning"
            showIcon
            action={
              <Button type="primary" onClick={() => router.push("/")}>
                Về trang chủ
              </Button>
            }
          />
        </div>
        <Footer />
      </div>
    );
  }

  const galleryImages = [
    activeImage,
    "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=600&q=80",
  ];

  const storageOptions = [
    { label: "128GB", priceAdd: 0 },
    { label: "256GB", priceAdd: 0 },
    { label: "512GB", priceAdd: 2000000 },
    { label: "1TB", priceAdd: 5000000 },
  ];

  const currentPrice = Number(product.price || 0) + (storageOptions.find((s) => s.label === selectedStorage)?.priceAdd || 0);

  const handleAddToCart = () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      message.warning("Vui lòng đăng nhập để sử dụng giỏ hàng!");
      router.push("/auth/login");
      return;
    }

    addToCart({
      productId: product.id,
      name: `${product.name} (${selectedStorage})`,
      price: currentPrice,
      quantity,
      image: activeImage,
      specs: `${selectedStorage} • Bảo hành chính hãng`,
    });
    message.success(`Đã thêm ${product.name} vào giỏ hàng!`);
  };

  const handleBuyNow = () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      message.warning("Vui lòng đăng nhập để tiếp tục mua hàng!");
      router.push("/auth/login");
      return;
    }

    handleAddToCart();
    setCartVisible(false);
    router.push("/orders/new");
  };

  return (
    <div className={styles.pageRoot}>
      <Header />
      <CartDrawer />

      <main className={styles.main}>
        <div className={styles.container}>
          {/* Mobile Top Navigation */}
          <div className={styles.mobileTopBar}>
            <button className={styles.navIconBtn} onClick={() => router.back()}>
              <ArrowLeftOutlined />
            </button>
            <span className={styles.topBarTitle}>{product.name}</span>
            <div className={styles.topBarActions}>
              <button
                className={styles.navIconBtn}
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({ title: product.name, url: window.location.href });
                  } else {
                    message.info("Đã sao chép liên kết sản phẩm!");
                  }
                }}
              >
                <ShareAltOutlined />
              </button>
              <button
                className={`${styles.navIconBtn} ${isWishlisted ? styles.activeWishlist : ""}`}
                onClick={() => setIsWishlisted(!isWishlisted)}
              >
                {isWishlisted ? <HeartFilled style={{ color: "#ff4d4f" }} /> : <HeartOutlined />}
              </button>
            </div>
          </div>

          {/* Desktop Breadcrumbs */}
          <div className={styles.desktopBreadcrumb}>
            <Breadcrumb
              items={[
                { title: "Trang chủ", href: "/" },
                { title: "Sản phẩm", href: "/#popular" },
                { title: product.name },
              ]}
            />
          </div>

          <Row gutter={[48, 48]} className={styles.contentRow}>
            {/* Gallery ảnh sản phẩm */}
            <Col xs={24} md={12}>
              <div className={styles.galleryWrapper}>
                <div className={styles.mainImageCard}>
                  {product.stock > 0 ? (
                    <span className={styles.tagBadge}>Còn hàng</span>
                  ) : (
                    <span style={{ background: "#fff1f0", color: "#f5222d" }} className={styles.tagBadge}>
                      Tạm hết hàng
                    </span>
                  )}
                  <img src={activeImage} alt={product.name} className={styles.mainImage} />
                </div>

                <div className={styles.thumbnailsRow}>
                  {galleryImages.map((img, idx) => (
                    <button
                      key={idx}
                      className={`${styles.thumbBtn} ${activeImage === img ? styles.thumbActive : ""}`}
                      onClick={() => setActiveImage(img)}
                    >
                      <img src={img} alt={`Thumbnail ${idx}`} />
                    </button>
                  ))}
                </div>
              </div>
            </Col>

            {/* Thông tin chi tiết */}
            <Col xs={24} md={12}>
              <div className={styles.detailsWrap}>
                <span className={styles.brandSubtitle}>Chính Hãng Phân Phối</span>
                <h1 className={styles.productTitle}>{product.name}</h1>

                <div className={styles.ratingRow}>
                  <Rate disabled defaultValue={5} allowHalf className={styles.stars} />
                  <span className={styles.ratingText}>
                    5.0 (Đánh giá hàng đầu từ người dùng)
                  </span>
                </div>

                <div className={styles.priceRow}>
                  <span className={styles.price}>
                    {currentPrice.toLocaleString("vi-VN")} đ
                  </span>
                  <span className={styles.oldPrice}>
                    {(currentPrice * 1.1).toLocaleString("vi-VN")} đ
                  </span>
                  <span className={styles.stockStatus}>
                    {/* <CheckOutlined style={{ color: "#52c41a" }} /> Kho còn: {product.stock ?? 0} sản phẩm */}
                  </span>
                </div>

                <Divider style={{ margin: "20px 0" }} />

                {/* Specs Pills */}
                <div className={styles.specsPills}>
                  <div className={styles.specPill}>
                    <span className={styles.pillLabel}>Màn hình</span>
                    <strong className={styles.pillVal}>Super AMOLED 120Hz</strong>
                  </div>
                  <div className={styles.specPill}>
                    <span className={styles.pillLabel}>Hiệu năng</span>
                    <strong className={styles.pillVal}>Chipset Flagship 5G</strong>
                  </div>
                  <div className={styles.specPill}>
                    <span className={styles.pillLabel}>Camera</span>
                    <strong className={styles.pillVal}>Chụp đêm AI Ultra</strong>
                  </div>
                  <div className={styles.specPill}>
                    <span className={styles.pillLabel}>Pin & Sạc</span>
                    <strong className={styles.pillVal}>Sạc siêu nhanh</strong>
                  </div>
                </div>

                {/* Chọn màu sắc */}
                <div className={styles.optionSection}>
                  <label className={styles.optionLabel}>
                    Phiên bản màu: <span>Titanium Premium</span>
                  </label>
                  <div className={styles.colorDotsRow}>
                    {["#2C3E50", "#C5A880", "#E0E0E0", "#1C1C1E"].map((colorHex) => (
                      <button
                        key={colorHex}
                        className={`${styles.colorDot} ${
                          selectedColor === colorHex ? styles.colorDotActive : ""
                        }`}
                        style={{ backgroundColor: colorHex }}
                        onClick={() => setSelectedColor(colorHex)}
                      />
                    ))}
                  </div>
                </div>

                {/* Chọn dung lượng */}
                <div className={styles.optionSection}>
                  <label className={styles.optionLabel}>
                    Dung lượng bộ nhớ: <span>{selectedStorage}</span>
                  </label>
                  <div className={styles.storageGrid}>
                    {storageOptions.map((opt) => (
                      <button
                        key={opt.label}
                        className={`${styles.storageBtn} ${
                          selectedStorage === opt.label ? styles.storageActive : ""
                        }`}
                        onClick={() => setSelectedStorage(opt.label)}
                      >
                        <span className={styles.storageVal}>{opt.label}</span>
                        {opt.priceAdd > 0 && (
                          <span className={styles.storageAdd}>+{opt.priceAdd.toLocaleString("vi-VN")} đ</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quantity & CTA Buttons (Desktop) */}
                <div className={styles.ctaDesktopRow}>
                  <div className={styles.qtyStepper}>
                    <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</button>
                    <span>{quantity}</span>
                    <button onClick={() => setQuantity(quantity + 1)}>+</button>
                  </div>

                  <Button
                    type="primary"
                    size="large"
                    icon={<ShoppingCartOutlined />}
                    className={styles.addCartBtn}
                    disabled={!product.stock || product.stock === 0}
                    onClick={handleAddToCart}
                  >
                    Thêm vào giỏ
                  </Button>

                  <Button
                    size="large"
                    className={styles.buyNowBtn}
                    disabled={!product.stock || product.stock === 0}
                    onClick={handleBuyNow}
                  >
                    Mua ngay
                  </Button>
                </div>

                {/* Cam kết dịch vụ */}
                <div className={styles.assuranceList}>
                  <div className={styles.assuranceItem}>
                    <TruckOutlined className={styles.asIcon} />
                    <span>Miễn phí giao hàng hỏa tốc toàn quốc</span>
                  </div>
                  <div className={styles.assuranceItem}>
                    <SafetyCertificateOutlined className={styles.asIcon} />
                    <span>Bảo hành chính hãng 12-24 tháng & Đổi trả trong 30 ngày</span>
                  </div>
                  <div className={styles.assuranceItem}>
                    <SyncOutlined className={styles.asIcon} />
                    <span>Cam kết 100% hàng thật, hoàn tiền gấp đôi nếu phát hiện giả</span>
                  </div>
                </div>
              </div>
            </Col>
          </Row>
        </div>
      </main>

      {/* Sticky Bottom Bar for Mobile Viewports */}
      <div className={styles.mobileStickyBottom}>
        <div className={styles.stickyPriceWrap}>
          <span className={styles.stickyPrice}>
            {currentPrice.toLocaleString("vi-VN")} đ
          </span>
          <span className={styles.stickySpec}>{selectedStorage} • Giao miễn phí</span>
        </div>
        <div className={styles.stickyActions}>
          <Button
            type="primary"
            size="large"
            icon={<ShoppingCartOutlined />}
            className={styles.stickyAddBtn}
            disabled={!product.stock || product.stock === 0}
            onClick={handleAddToCart}
          >
            Thêm giỏ
          </Button>
        </div>
      </div>

      <Footer />
    </div>
  );
}
