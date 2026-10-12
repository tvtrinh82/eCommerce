"use client";

import React, { useState, useEffect } from "react";
import { Typography, Row, Col, Button, message, Space, Divider, Radio, Tag, Breadcrumb, Skeleton, theme } from "antd";
import { ShoppingCartOutlined, HeartOutlined, ThunderboltOutlined, HomeOutlined } from "@ant-design/icons";
import { useParams, useRouter } from "next/navigation";
import ClientLayout from "@/components/shared/ClientLayout";
import Link from "next/link";
import { useThemeStore } from "@/store/themeStore";
import { useCartStore } from "@/store/cartStore";

const { Title, Text, Paragraph } = Typography;

const COLORS = ["Titan Tự nhiên", "Titan Đen", "Titan Trắng", "Titan Xanh"];
const STORAGES = ["256GB", "512GB", "1TB"];

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [messageApi, contextHolder] = message.useMessage();
  
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [selectedStorage, setSelectedStorage] = useState(STORAGES[0]);
  const { isDarkMode } = useThemeStore();
  const { addToCart, setCartVisible } = useCartStore();
  const { token } = theme.useToken();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        // Workaround: GET /api/products/{id} is failing (500) due to Redis @Cacheable error on backend.
        // Since we cannot modify the backend, we fetch the product list and find the product by ID.
        const res = await fetch(`/api/products?page=0&size=100`);
        if (res.ok) {
          const json = await res.json();
          const list = json.data?.content || json.data || [];
          const found = list.find((p: any) => p.id === parseInt(params.id as string));
          if (found) {
            setProduct(found);
          } else {
            console.warn("Product not found in list");
          }
        }
      } catch (error) {
        console.error("Failed to fetch product:", error);
      } finally {
        setLoading(false);
      }
    };
    if (params.id) {
      fetchProduct();
    }
  }, [params.id]);

  const handleAddToCart = () => {
    if (!product) return;
    const attributes = [];
    if (hasColor) attributes.push(selectedColor);
    if (hasStorage) attributes.push(selectedStorage);
    const attrString = attributes.length > 0 ? ` (${attributes.join(', ')})` : '';

    addToCart({
      productId: product.id,
      name: `${product.name}${attrString}`,
      price: product.price * priceMultiplier,
      quantity: 1,
      image: product.imageUrl || "https://placehold.co/200x200?text=No+Image"
    });
    setCartVisible(true);
    messageApi.success(`Đã thêm ${product?.name} vào giỏ hàng`);
  };

  const handleBuyNow = () => {
    if (!product) return;
    const attributes = [];
    if (hasColor) attributes.push(selectedColor);
    if (hasStorage) attributes.push(selectedStorage);
    const attrString = attributes.length > 0 ? ` (${attributes.join(', ')})` : '';

    addToCart({
      productId: product.id,
      name: `${product.name}${attrString}`,
      price: product.price * priceMultiplier,
      quantity: 1,
      image: product.imageUrl || "https://placehold.co/1000x1000?text=No+Image"
    });
    setCartVisible(false);
    router.push("/orders/new");
  };

  if (loading) {
    return (
      <ClientLayout>
        <div style={{ padding: "40px 10%", maxWidth: 1200, margin: "0 auto", backgroundColor: isDarkMode ? '#0f0f11' : '#f5f5f7' }}>
          <Skeleton active paragraph={{ rows: 10 }} />
        </div>
      </ClientLayout>
    );
  }

  if (!product) {
    return (
      <ClientLayout>
        <div style={{ padding: "100px 10%", textAlign: "center", backgroundColor: token.colorBgBase }}>
          <Title level={3} style={{ color: token.colorText }}>Không tìm thấy sản phẩm</Title>
          <Button type="primary" onClick={() => router.push("/")} style={{ marginTop: 20 }}>Về trang chủ</Button>
        </div>
      </ClientLayout>
    );
  }

  const productNameLower = product.name?.toLowerCase() || '';
  // Kiểm tra phụ kiện (ốp lưng, bao da, dán màn hình, cáp sạc, tai nghe,...) -> không hiển thị màu/dung lượng
  const isAccessory = 
    productNameLower.includes('ốp') || 
    productNameLower.includes('op') || 
    productNameLower.includes('bao da') || 
    productNameLower.includes('case') || 
    productNameLower.includes('cường lực') || 
    productNameLower.includes('kính') || 
    productNameLower.includes('dán') || 
    productNameLower.includes('sạc') || 
    productNameLower.includes('cáp') || 
    productNameLower.includes('dây');

  // Chỉ hiển thị màu sắc và dung lượng với Điện thoại thật (không phải ốp lưng hay phụ kiện)
  const isPhone = 
    !isAccessory && 
    (productNameLower.includes('iphone') || productNameLower.includes('điện thoại') || productNameLower.includes('phone'));
    
  const hasColor = isPhone;
  const hasStorage = isPhone;

  // Adjust price based on storage just for UI effect
  const priceMultiplier = hasStorage ? (STORAGES.indexOf(selectedStorage) * 0.2 + 1) : 1;
  const currentPrice = product.price * priceMultiplier;

  return (
    <ClientLayout>
      {contextHolder}
      <div style={{ padding: "40px 10%", maxWidth: 1400, margin: "0 auto" }}>
        
        <Breadcrumb style={{ marginBottom: 32, fontSize: 15 }} items={[
          { title: <Link href="/" style={{ color: isDarkMode ? '#a1a1aa' : '#52525b' }}><HomeOutlined /> Trang chủ</Link> },
          { title: <Link href="/" style={{ color: isDarkMode ? '#a1a1aa' : '#52525b' }}>Sản phẩm</Link> },
          { title: <span style={{ color: isDarkMode ? '#ffffff' : '#18181b', fontWeight: 600 }}>{product.name}</span> }
        ]} />

        <Row gutter={[64, 48]}>
          {/* Image Section */}
          <Col xs={24} md={12}>
            <div style={{ 
              backgroundColor: isDarkMode ? "#1f1f23" : "#f4f4f5", 
              borderRadius: 30, 
              padding: 40,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              border: isDarkMode ? '1px solid #27272a' : '1px solid #e4e4e7',
              boxShadow: isDarkMode ? 'inset 0 0 40px rgba(0,0,0,0.5)' : 'none'
            }}>
              <img 
                src={product.imageUrl || "https://placehold.co/1000x1000?text=No+Image"} 
                alt={product.name} 
                style={{ width: "100%", maxWidth: 400, maxHeight: 400, objectFit: "contain" }} 
              />
            </div>
          </Col>

          {/* Details Section */}
          <Col xs={24} md={12}>
            <Title level={1} style={{ marginTop: 0, marginBottom: 16, fontSize: 36, fontWeight: 700, letterSpacing: -0.5, color: isDarkMode ? '#ffffff' : '#18181b', textRendering: 'optimizeLegibility', WebkitFontSmoothing: 'antialiased' }}>{product.name}</Title>
            <Space style={{ marginBottom: 28, alignItems: 'baseline', gap: 16 }}>
              <Text strong style={{ color: isDarkMode ? '#ffffff' : '#18181b', fontSize: 32, whiteSpace: 'nowrap' }}>{currentPrice.toLocaleString("vi-VN")} đ</Text>
              {product.oldPrice && <Text delete style={{ fontSize: 18, color: isDarkMode ? '#71717a' : '#a1a1aa', whiteSpace: 'nowrap' }}>{(product.oldPrice * priceMultiplier).toLocaleString("vi-VN")} đ</Text>}
            </Space>

            <Divider style={{ borderColor: isDarkMode ? '#27272a' : '#e4e4e7' }} />

            {hasColor && (
              <div style={{ marginBottom: 28 }}>
                <Text strong style={{ fontSize: 16, display: "block", marginBottom: 14, color: isDarkMode ? '#f4f4f5' : '#18181b' }}>Chọn Màu sắc:</Text>
                <Radio.Group 
                  value={selectedColor} 
                  onChange={e => setSelectedColor(e.target.value)}
                  optionType="button"
                  buttonStyle="solid"
                  size="large"
                >
                  {COLORS.map(color => (
                    <Radio.Button key={color} value={color} style={{ borderRadius: 8, margin: '0 8px 8px 0', border: isDarkMode ? '1px solid #3f3f46' : '1px solid #d4d4d8' }}>{color}</Radio.Button>
                  ))}
                </Radio.Group>
              </div>
            )}

            {hasStorage && (
              <div style={{ marginBottom: 32 }}>
                {/* <Text strong style={{ fontSize: 16, display: "block", marginBottom: 14, color: isDarkMode ? '#f4f4f5' : '#18181b' }}>Chọn Dung lượng (GB):</Text> */}
                <Radio.Group 
                  value={selectedStorage} 
                  onChange={e => setSelectedStorage(e.target.value)}
                  optionType="button"
                  buttonStyle="solid"
                  size="large"
                >
                  {STORAGES.map(gb => (
                    <Radio.Button key={gb} value={gb} style={{ borderRadius: 8, margin: '0 8px 8px 0', border: isDarkMode ? '1px solid #3f3f46' : '1px solid #d4d4d8' }}>{gb}</Radio.Button>
                  ))}
                </Radio.Group>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%' }}>
              <Button
                type="primary"
                size="large"
                shape="round"
                disabled={product.stock === 0}
                onClick={handleBuyNow}
                style={{ height: 56, fontSize: 17, fontWeight: 600, backgroundColor: product.stock > 0 ? (isDarkMode ? '#ffffff' : '#18181b') : undefined, color: isDarkMode ? '#18181b' : '#ffffff', border: 'none' }}
                block
              >
                {product.stock > 0 ? "Mua ngay" : "Hết hàng"}
              </Button>
              
              <Button 
                size="large"
                shape="round" 
                icon={<ShoppingCartOutlined />} 
                disabled={product.stock === 0}
                onClick={handleAddToCart}
                style={{ height: 56, fontSize: 17, fontWeight: 600, backgroundColor: isDarkMode ? '#27272a' : '#e4e4e7', color: isDarkMode ? '#f4f4f5' : '#18181b', border: isDarkMode ? '1px solid #3f3f46' : '1px solid #d4d4d8' }}
                block
              >
                Thêm vào giỏ hàng
              </Button>
            </div>

            <Divider style={{ borderColor: isDarkMode ? '#27272a' : '#e4e4e7' }} />

            <div style={{ marginTop: 28 }}>
              <Title level={4} style={{ color: isDarkMode ? '#ffffff' : '#18181b' }}>Đặc điểm nổi bật</Title>
              <Paragraph style={{ fontSize: 15, color: isDarkMode ? '#d4d4d8' : '#3f3f46', lineHeight: 1.8 }}>
                {product.description || `Sản phẩm ${product.name} chính hãng. Thiết kế hiện đại, cấu hình mạnh mẽ, đáp ứng mọi nhu cầu sử dụng của bạn. Bảo hành 12 tháng tại các trung tâm ủy quyền.`}
              </Paragraph>
              <ul style={{ paddingLeft: 20, fontSize: 14, color: isDarkMode ? '#d4d4d8' : '#3f3f46', lineHeight: 2 }}>
                <li>Màn hình Super Retina XDR sáng hơn và sắc nét hơn.</li>
                <li>Chip A-series thế hệ mới cho hiệu năng vượt trội.</li>
                <li>Hệ thống camera Pro chụp ảnh và quay video tuyệt đỉnh.</li>
                <li>Thời lượng pin cả ngày, hỗ trợ sạc nhanh.</li>
              </ul>
            </div>
          </Col>
        </Row>
      </div>
    </ClientLayout>
  );
}
