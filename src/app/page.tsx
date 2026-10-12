"use client";

import React, { useState } from "react";
import { Typography, Card, Row, Col, Button, message, Drawer, List, Space, Carousel, Tooltip, theme, Rate } from "antd";
import { ShoppingCartOutlined, HeartOutlined, ThunderboltOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import ClientLayout from "@/components/shared/ClientLayout";
import { useThemeStore } from "@/store/themeStore";
import { useCartStore } from "@/store/cartStore";

import { useSearchParams } from "next/navigation";

const { Title, Text } = Typography;

export default function ClientStorefront() {
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const search = searchParams?.get("search") || "";
  const { isDarkMode } = useThemeStore();
  const { addToCart, setCartVisible } = useCartStore();
  const { token } = theme.useToken();

  React.useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch("/api/products?page=0&size=100&sort=id,desc");
        if (res.ok) {
          const json = await res.json();
          const data = json.data?.content || json.data || [];
          setProducts(data);
        }
      } catch (error) {
        console.error("Failed to fetch products:", error);
      }
    };
    fetchProducts();
  }, []);

  const filteredProducts = products.filter(p => 
    p.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <ClientLayout>
      {!search && (
        <>
          {/* HERO BANNER CAROUSEL */}
          <Carousel autoplay effect="fade">
            <div>
              <div style={{ height: 600, backgroundColor: isDarkMode ? "#000" : "#f5f5f7", backgroundImage: isDarkMode ? 'linear-gradient(180deg, #1c1c1e 0%, #000 100%)' : 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: isDarkMode ? '#fff' : '#1d1d1f' }}>
                <Title style={{ color: isDarkMode ? '#fff' : '#1d1d1f', fontSize: 64, margin: 0, fontWeight: 700, letterSpacing: -1 }}>iPhone 16 Pro</Title>
                <Title level={3} style={{ color: isDarkMode ? '#a1a1a6' : '#86868b', marginTop: 10, fontWeight: 400, letterSpacing: 1 }}>Titan. Chắc. Nhẹ. Pro.</Title>
                <div style={{ marginTop: 30 }}>
                  <Button type="primary" size="large" shape="round" style={{ marginRight: 16, height: 44, padding: '0 24px', fontSize: 16, fontWeight: 500 }}>Mua ngay</Button>
                  <Button ghost={isDarkMode} size="large" shape="round" style={{ height: 44, padding: '0 24px', fontSize: 16, fontWeight: 500, borderColor: isDarkMode ? 'rgba(255,255,255,0.3)' : '#ccc' }}>Tìm hiểu thêm</Button>
                </div>
              </div>
            </div>
            <div>
              <div style={{ height: 600, backgroundColor: isDarkMode ? "#050505" : "#e5e5ea", backgroundImage: isDarkMode ? 'radial-gradient(circle at center, #1a1a1c 0%, #050505 100%)' : 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: isDarkMode ? '#fff' : '#1d1d1f' }}>
                <Title style={{ color: isDarkMode ? '#fff' : '#1d1d1f', fontSize: 64, margin: 0, fontWeight: 700, letterSpacing: -1 }}>MacBook Pro M3</Title>
                <Title level={3} style={{ color: isDarkMode ? '#a1a1a6' : '#86868b', marginTop: 10, fontWeight: 400, letterSpacing: 1 }}>Sức mạnh vô hạn. Đột phá không tưởng.</Title>
                <div style={{ marginTop: 30 }}>
                  <Button type="primary" size="large" shape="round" style={{ marginRight: 16, height: 44, padding: '0 24px', fontSize: 16, fontWeight: 500 }}>Mua ngay</Button>
                </div>
              </div>
            </div>
          </Carousel>

          <div style={{ padding: "40px 10%", maxWidth: 1400, margin: "0 auto" }}>
            {/* FEATURED PRODUCTS SECTION */}
            <div style={{ marginBottom: 60 }}>
              {['iPhone', 'iPad', 'Mac', 'Watch', 'Phụ kiện'].map((category) => {
                // Lọc sản phẩm theo danh mục (dựa vào tên)
                let categoryProducts = products.filter(p => {
                  const nameLower = (p.name || '').toLowerCase();
                  if (category === 'iPhone') return nameLower.includes('iphone');
                  if (category === 'iPad') return nameLower.includes('ipad');
                  if (category === 'Mac') return nameLower.includes('mac');
                  if (category === 'Watch') return nameLower.includes('watch');
                  if (category === 'Phụ kiện') return !nameLower.includes('iphone') && !nameLower.includes('ipad') && !nameLower.includes('mac') && !nameLower.includes('watch');
                  return false;
                });
                
                // QUAN TRỌNG: Ưu tiên lọc và hiển thị tất cả các sản phẩm "Có sẵn" lên đầu danh sách trước
                categoryProducts = categoryProducts.sort((a, b) => {
                  const aInStock = (a.stock && a.stock > 0) ? 1 : 0;
                  const bInStock = (b.stock && b.stock > 0) ? 1 : 0;
                  return bInStock - aInStock; // 1 (Có sẵn) lên trước 0 (Hết hàng)
                });

                if (categoryProducts.length === 0) return null;

                return (
                  <div key={category} style={{ marginBottom: 60 }}>
                    <Title level={2} style={{ textAlign: "center", marginBottom: 30, fontSize: 32, fontWeight: 700, color: isDarkMode ? '#fff' : '#1d1d1f' }}>{category}</Title>
                    <Row gutter={[24, 24]}>
                      {categoryProducts.map((item) => (
                        <Col xs={24} sm={12} md={8} lg={7} key={item.id}>
                          <Card
                            hoverable
                            style={{ borderRadius: 20, overflow: 'hidden', border: isDarkMode ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)', boxShadow: isDarkMode ? '0 10px 30px rgba(0,0,0,0.5)' : '0 10px 30px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', transition: 'transform 0.3s ease, box-shadow 0.3s ease', backgroundColor: isDarkMode ? '#2a2a2c' : '#ffffff', height: '100%' }}
                            styles={{ body: { padding: '24px', display: 'flex', flexDirection: 'column', flexGrow: 1, backgroundColor: isDarkMode ? '#2a2a2c' : '#ffffff', height: '100%' } }}
                            onClick={() => router.push(`/products/${item.id}`)}
                            cover={
                              <div style={{ padding: 30, display: 'flex', justifyContent: 'center', backgroundColor: isDarkMode ? '#333333' : '#f5f5f7', borderBottom: isDarkMode ? '1px solid rgba(255,255,255,0.02)' : 'none', position: 'relative' }}>
                                <img className="product-card-img" alt={item.name} src={item.imageUrl || "https://placehold.co/600x600?text=No+Image"} style={{ height: 200, objectFit: "contain", width: "100%" }} />
                                {/* Hot Sale Badge Monochrome */}
                                <div style={{ 
                                  position: 'absolute', 
                                  top: 12, 
                                  left: 12, 
                                  background: item.stock > 0 ? (isDarkMode ? '#e90a0aff' : '#e51030ff') : '#71717a', 
                                  color: item.stock > 0 ? (isDarkMode ? '#f8f8fcd5' : '#ffffff') : '#ffffff', 
                                  padding: '4px 12px', 
                                  borderRadius: 9999, 
                                  fontSize: 12, 
                                  fontWeight: 600,
                                  boxShadow: '0 2px 8px rgba(236, 19, 19, 0.15)'
                                }}>
                                  {item.stock > 0 ? "Hot Sale" : "Hết hàng"}
                                </div>
                              </div>
                            }
                          >
                            <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, justifyContent: 'space-between' }}>
                              <div>
                                <div style={{ fontSize: 18, fontWeight: 'bold', color: isDarkMode ? '#fff' : '#1d1d1f', height: 54, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', marginBottom: 12, textRendering: 'optimizeLegibility', WebkitFontSmoothing: 'antialiased' }}>{item.name}</div>
                                
                                <Space style={{ alignItems: 'center' }}>
                                  <Text strong style={{ color: isDarkMode ? '#ffffff' : '#18181b', fontSize: 20 }}>{item.price?.toLocaleString("vi-VN")} đ</Text>
                                  <Text delete type="secondary" style={{ fontSize: 14, color: isDarkMode ? '#a1a1aa' : '#71717a' }}>{(item.price * 1.1).toLocaleString("vi-VN")} đ</Text>
                                </Space>
                              </div>
                              
                              <div style={{ marginTop: 16, display: 'flex', gap: 8, flexDirection: 'column' }}>
                                <Button
                                  type="primary"
                                  shape="round"
                                  disabled={!item.stock || item.stock === 0}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    if (item.stock > 0) {
                                      addToCart({ productId: item.id, name: item.name, price: item.price, quantity: 1, image: item.imageUrl || "https://placehold.co/600x600?text=No+Image" });
                                      setCartVisible(false);
                                      router.push("/orders/new");
                                    }
                                  }}
                                  style={{ 
                                    backgroundColor: (item.stock > 0) ? (isDarkMode ? '#ffffff' : '#18181b') : undefined, 
                                    color: (item.stock > 0) ? (isDarkMode ? '#18181b' : '#ffffff') : undefined,
                                    border: 'none',
                                    fontWeight: 600,
                                    height: 40 
                                  }}
                                  block
                                >
                                  {(item.stock > 0) ? "Mua ngay" : "Hết hàng"}
                                </Button>
                                
                                <Button 
                                  shape="round" 
                                  icon={<ShoppingCartOutlined />} 
                                  style={{ 
                                    backgroundColor: isDarkMode ? '#27272a' : '#f4f4f5', 
                                    color: isDarkMode ? '#f4f4f5' : '#18181b', 
                                    border: isDarkMode ? '1px solid #3f3f46' : '1px solid #e4e4e7', 
                                    fontWeight: 500,
                                    height: 40 
                                  }}
                                  disabled={!item.stock || item.stock === 0}
                                  onClick={(e) => { 
                                    e.stopPropagation(); 
                                    addToCart({ productId: item.id, name: item.name, price: item.price, quantity: 1, image: item.imageUrl || "https://placehold.co/600x600?text=No+Image" }); 
                                    message.success(`Đã thêm ${item.name} vào giỏ hàng`);
                                  }}
                                  block
                                >
                                  Thêm vào giỏ hàng
                                </Button>
                              </div>
                            </div>
                          </Card>
                        </Col>
                      ))}
                    </Row>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {search && (
        <div style={{ padding: "40px 10%", maxWidth: 1400, margin: "0 auto", minHeight: "60vh" }}>
          <Title level={2} style={{ marginBottom: 30, fontSize: 28, fontWeight: 700 }}>Kết quả tìm kiếm cho: "{search}"</Title>
          {filteredProducts.length === 0 ? (
            <div style={{ textAlign: 'center', marginTop: 50 }}>
              <Text type="secondary" style={{ fontSize: 16 }}>Không tìm thấy sản phẩm nào.</Text>
            </div>
          ) : (
            <Row gutter={[24, 24]}>
              {filteredProducts.map((item) => (
                <Col xs={24} sm={12} md={8} lg={7} key={item.id}>
                  <Card
                    hoverable
                    style={{ borderRadius: 20, overflow: 'hidden', border: isDarkMode ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)', boxShadow: isDarkMode ? '0 10px 30px rgba(0,0,0,0.5)' : '0 10px 30px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', transition: 'transform 0.3s ease, box-shadow 0.3s ease', backgroundColor: isDarkMode ? '#2a2a2c' : '#ffffff', height: '100%' }}
                    styles={{ body: { padding: '24px', display: 'flex', flexDirection: 'column', flexGrow: 1, backgroundColor: isDarkMode ? '#2a2a2c' : '#ffffff', height: '100%' } }}
                    onClick={() => router.push(`/products/${item.id}`)}
                    cover={
                      <div style={{ padding: 30, display: 'flex', justifyContent: 'center', backgroundColor: isDarkMode ? '#e00b0bff' : '#f5f5f7', borderBottom: isDarkMode ? '1px solid rgba(255,255,255,0.02)' : 'none', position: 'relative' }}>
                        <img className="product-card-img" alt={item.name} src={item.imageUrl || "https://placehold.co/600x600?text=No+Image"} style={{ height: 200, objectFit: "contain", width: "100%" }} />
                        {/* Hot Sale Badge */}
                        <div style={{ position: 'absolute', top: 12, left: 12, background: 'linear-gradient(90deg, #ff4d4f 0%, #ff7875 100%)', color: '#fff', padding: '4px 12px', borderRadius: 12, fontSize: 12, fontWeight: 600 }}>
                          {item.stock > 0 ? "Hot Sale" : "Hết hàng"}
                        </div>
                      </div>
                    }
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontSize: 18, fontWeight: 'bold', color: isDarkMode ? '#fff' : '#1d1d1f', height: 54, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', marginBottom: 12, textRendering: 'optimizeLegibility', WebkitFontSmoothing: 'antialiased' }}>{item.name}</div>
                        
                        <Space style={{ alignItems: 'center' }}>
                          <Text strong style={{ color: token.colorPrimary, fontSize: 20 }}>{item.price?.toLocaleString("vi-VN")} đ</Text>
                          <Text delete type="secondary" style={{ fontSize: 14, color: isDarkMode ? '#a1a1a6' : '#86868b' }}>{(item.price * 1.1).toLocaleString("vi-VN")} đ</Text>
                        </Space>
                      </div>
                      
                      <div style={{ marginTop: 16, display: 'flex', gap: 8, flexDirection: 'column' }}>
                        <Button
                          type="primary"
                          shape="round"
                          disabled={!item.stock || item.stock === 0}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (item.stock > 0) {
                                      addToCart({ productId: item.id, name: item.name, price: item.price, quantity: 1, image: item.imageUrl || "https://placehold.co/600x600?text=No+Image" });
                                      setCartVisible(false);
                                      router.push("/orders/new");
                            }
                          }}
                          style={{ backgroundColor: (item.stock > 0) ? '#0066cc' : undefined, height: 40 }}
                          block
                        >
                          {(item.stock > 0) ? "Mua ngay" : "Hết hàng"}
                        </Button>
                        
                        <Button 
                          shape="round" 
                          icon={<ShoppingCartOutlined />} 
                          style={{ backgroundColor: isDarkMode ? '#333' : '#e5e5ea', color: isDarkMode ? '#fff' : '#000', border: 'none', height: 40 }}
                          disabled={!item.stock || item.stock === 0}
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            addToCart({ productId: item.id, name: item.name, price: item.price, quantity: 1, image: item.imageUrl || "https://placehold.co/600x600?text=No+Image" }); 
                            message.success(`Đã thêm ${item.name} vào giỏ hàng`);
                          }}
                          block
                        >
                          Thêm vào giỏ hàng
                        </Button>
                      </div>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </div>
      )}
    </ClientLayout>
  );
}
