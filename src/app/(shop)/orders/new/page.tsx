"use client";

import React, { useState, useEffect } from "react";
import { Typography, Form, Select, InputNumber, Button, Table, message, Row, Col, Space, Card, Input } from "antd";
import { DeleteOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { useThemeStore } from "@/store/themeStore";
import { useCartStore } from "@/store/cartStore";
import { ConfigProvider, theme } from "antd";
import { apiClient } from "@/lib/api-client";
import ClientLayout from "@/components/shared/ClientLayout";

const { Title, Text } = Typography;

interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  status: string;
}

interface OrderItem {
  key: string;
  productId: number;
  name: string;
  price: number;
  quantity: number;
  stock: number;
}

export default function CreateOrderPage() {
  const router = useRouter();
  const [form] = Form.useForm();
  const { isDarkMode } = useThemeStore();
  const { cart, clearCart } = useCartStore();

  const [user, setUser] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
      if (!token) {
        message.warning("Vui lòng đăng nhập để thanh toán");
        router.push("/auth/login");
        return;
      }
      try {
        setLoadingUser(true);
        // apiClient đã tự gán token vào Header và tự unwraps res.data
        const meRes: any = await apiClient.get('/auth/me');
        const userData = meRes?.data || meRes;
        
        if (userData) {
          const custId = userData.customerId || userData.id;
          let customerInfo: any = null;
          if (custId) {
            try {
              const custRes: any = await apiClient.get(`/customers/${custId}`);
              customerInfo = custRes?.data || custRes;
            } catch (err) {
              console.error("Lỗi tải thông tin chi tiết customer:", err);
            }
          }
          const combinedUser = { ...userData, ...(customerInfo || {}) };
          setUser(combinedUser);
          const displayName = `${combinedUser.name || combinedUser.customerName || combinedUser.username || "Khách hàng"}${combinedUser.email ? ` - ${combinedUser.email}` : ''}`;
          form.setFieldsValue({
            customerDisplay: displayName,
          });
        }
      } catch (e: any) {
        console.error("Failed to fetch user", e);
      } finally {
        setLoadingUser(false);
      }
    };
    fetchUser();
    fetchProducts();
  }, [router, form]);

  useEffect(() => {
    // Initialize order items from cart if empty
    if (cart.length > 0 && orderItems.length === 0) {
      setOrderItems(cart.map(c => ({
        key: c.productId.toString(),
        productId: c.productId,
        name: c.name,
        price: c.price,
        quantity: c.quantity,
        stock: 99 // default since cart doesn't store stock
      })));
    }
  }, [cart]);

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

  const handleAddLine = () => {
    if (!selectedProductId) {
      message.warning("Vui lòng chọn sản phẩm");
      return;
    }
    const product = products.find(p => p.id === selectedProductId);
    if (!product) return;

    if (quantity < 1 || quantity > 99) {
      message.error("Số lượng phải từ 1 đến 99");
      return;
    }

    setOrderItems(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        const newQty = existing.quantity + quantity;
        if (newQty > 99) {
          message.error("Số lượng cộng dồn vượt quá 99");
          return prev;
        }
        return prev.map(item =>
          item.productId === product.id ? { ...item, quantity: newQty } : item
        );
      }
      return [...prev, { 
        key: product.id.toString(), 
        productId: product.id, 
        name: product.name, 
        price: product.price, 
        quantity, 
        stock: product.stock 
      }];
    });

    setSelectedProductId(null);
    setQuantity(1);
  };

  const handleRemoveLine = (productId: number) => {
    setOrderItems(prev => prev.filter(item => item.productId !== productId));
  };

  const handleCreateOrder = async () => {
    try {
      if (orderItems.length === 0) {
        message.error("Đơn hàng phải có ít nhất 1 sản phẩm");
        return;
      }

      setSubmitting(true);
      const token = localStorage.getItem("token");

      const payload = {
        customerId: user?.customerId || user?.id,
        items: orderItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity
        }))
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Tạo đơn hàng thất bại");
      }

      message.success("Tạo đơn hàng thành công");
      clearCart();
      const createdOrder = Array.isArray(data.data) ? data.data[0] : data.data;
      router.push(`/orders/${createdOrder.id}`);

    } catch (error: any) {
      message.error(error.message || "Lỗi tạo đơn hàng");
    } finally {
      setSubmitting(false);
    }
  };

  const totalAmount = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const columns = [
    {
      title: "Sản phẩm",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Đơn giá",
      dataIndex: "price",
      key: "price",
      render: (val: number) => `${val?.toLocaleString("vi-VN")} đ`
    },
    {
      title: "SL",
      dataIndex: "quantity",
      key: "quantity",
    },
    {
      title: "Thành tiền",
      key: "total",
      render: (_: any, record: OrderItem) => `${(record.price * record.quantity).toLocaleString("vi-VN")} đ`
    },
    {
      title: "Xoá",
      key: "action",
      render: (_: any, record: OrderItem) => (
        <Button
          type="text"
          style={{ color: '#1677ff' }}
          icon={<DeleteOutlined />}
          onClick={() => handleRemoveLine(record.productId)}
        />
      )
    }
  ];

  return (
    <ClientLayout>
    <ConfigProvider theme={{ algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm }}>
      
      <div style={{ padding: "40px 20px", maxWidth: 900, margin: "0 auto", minHeight: "calc(100vh - 64px)", backgroundColor: isDarkMode ? "#eeededff" : "#f0f2f5" }}>
        <Title level={4} style={{ marginBottom: 24 }}>Tạo đơn hàng</Title>
        
        <Card 
          variant="outlined" 
          style={{ 
            borderRadius: 8, 
            borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : '#d9d9d9',
            backgroundColor: isDarkMode ? '#e0e0e5ff' : '#f5f5f7'
          }}
          styles={{ body: { padding: '24px' } }}
        >
          <Form form={form} layout="vertical">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ flex: 1, maxWidth: 450 }}>
                <Text strong style={{ display: 'block', marginBottom: 8 }}>Khách hàng</Text>
                <Input 
                  readOnly 
                  value={user ? `${user.name || user.customerName || user.username || "Khách hàng"}${user.email ? ` - ${user.email}` : ''}` : (loadingUser ? "Đang tải thông tin khách hàng..." : "Không có dữ liệu khách hàng")}
                  style={{ width: '100%', fontWeight: 'bold', color: isDarkMode ? '#524d4dff' : '#6b6868ff', backgroundColor: isDarkMode ? '#f5f5f5' : '#f5f5f5', height: 38 }} 
                  placeholder="Thông tin khách hàng"
                />
              </div>
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={() => {
                  if (window.history.length > 1) {
                    router.back();
                  } else {
                    router.push('/');
                  }
                }}
                style={{ borderRadius: 8, height: 38, marginTop: 22 }}
              >
                Thoát
              </Button>
            </div>

            <Row gutter={16} align="bottom" style={{ marginBottom: 16 }}>
              <Col xs={24} sm={12} md={10}> 
                <Form.Item label={<Text strong>Sản phẩm</Text>} style={{ marginBottom: 0 }}>
                  <Select
                    showSearch
                    placeholder="Chọn sản phẩm"
                    style={{ width: '100%' }}
                    value={selectedProductId}
                    onChange={setSelectedProductId}
                    loading={loadingProducts}
                    optionFilterProp="children"
                  >
                    {products.map(p => {
                      const disabled = p.stock === 0 || p.status !== 'ACTIVE';
                      return (
                        <Select.Option key={p.id} value={p.id} disabled={disabled}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>{p.name}</span>
                            {disabled && (
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                Hết hàng
                              </Text>
                            )}
                          </div>
                        </Select.Option>
                      );
                    })}
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={12} sm={6} md={4}>
                <Form.Item label={<Text type="secondary">Số lượng </Text>} style={{ marginBottom: 0 }}>
                  <InputNumber
                    min={1}
                    max={99}
                    style={{ width: '100%' }}
                    value={quantity}
                    onChange={(val) => setQuantity(val || 1)}
                  />
                </Form.Item>
              </Col>
              <Col xs={12} sm={6} md={4}>
                <Button 
                  style={{ backgroundColor: '#e6f4ff', color: '#1677ff', borderColor: '#91caff' }}
                  onClick={handleAddLine}
                  block
                >
                  Thêm sản phẩm
                </Button>
              </Col>
            </Row>

            <Table
              dataSource={orderItems}
              columns={columns}
              pagination={false}
              size="middle"
              locale={{ emptyText: "Chưa có sản phẩm nào trong đơn" }}
              style={{ marginBottom: 24, borderTop: '1px solid #f0f0f0' }}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 16 }}>
              <Text strong style={{ fontSize: 16 }}>Tạm tính: {totalAmount.toLocaleString("vi-VN")} đ</Text>
              <Button
                type="primary"
                onClick={handleCreateOrder}
                loading={submitting}
                style={{ backgroundColor: '#e6f4ff', color: '#1677ff', borderColor: '#91caff', height: 38, padding: '0 24px', fontWeight: 600 }}
              >
                Tạo đơn
              </Button>
            </div>
          </Form>
        </Card>
      </div>
    </ConfigProvider>
    </ClientLayout>
  );
}
