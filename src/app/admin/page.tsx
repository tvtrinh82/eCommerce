"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, Row, Col, Typography, Statistic, Table, Tag, Alert, Spin } from "antd";
import {
  ShoppingCart,
  Package,
  TrendingUp,
  AlertCircle,
  DollarSign
} from "lucide-react";

const { Title, Text } = Typography;

interface DashboardData {
  date: string;
  revenueToday: number;
  orderCountByStatus: Record<string, number>;
  top5Products: Array<{ productId: number; name: string; quantitySold: number; }>;
  lowStockProducts: Array<{ productId: number; name: string; stock: number; }>;
  partial: boolean;
  failedParts: string[];
}

export default function Dashboard() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = { "Authorization": token ? `Bearer ${token}` : "" };

        // Fetch orders and products in parallel
        const [ordersRes, productsRes] = await Promise.all([
          fetch("/api/orders?page=0&size=1000", { headers }),
          fetch("/api/products?page=0&size=1000", { headers })
        ]);

        if (!ordersRes.ok || !productsRes.ok) {
          if (ordersRes.status === 401 || productsRes.status === 401) {
            window.location.href = "/auth/login";
            return;
          }
          throw new Error("Failed to fetch data for dashboard");
        }

        const ordersJson = await ordersRes.json();
        const productsJson = await productsRes.json();

        const orders = ordersJson.data?.content || ordersJson.data || [];
        const products = productsJson.data?.content || productsJson.data || [];

        let revenueToday = 0;
        const orderCountByStatus: Record<string, number> = {};

        // Product ID -> Quantity Sold
        const productSales: Record<number, number> = {};

        // Compute from orders
        orders.forEach((order: any) => {
          // Count status
          orderCountByStatus[order.status] = (orderCountByStatus[order.status] || 0) + 1;

          // Revenue (only from paid/completed orders usually, but we sum totalAmount for demo)
          revenueToday += order.totalAmount || 0;

          // Sales volume
          order.items?.forEach((item: any) => {
            productSales[item.productId] = (productSales[item.productId] || 0) + item.quantity;
          });
        });

        // Top 5 products
        const top5Products = Object.keys(productSales)
          .map(id => {
            const prod = products.find((p: any) => p.id === parseInt(id));
            return {
              productId: parseInt(id),
              name: prod ? prod.name : `Product #${id}`,
              quantitySold: productSales[parseInt(id)]
            };
          })
          .sort((a, b) => b.quantitySold - a.quantitySold)
          .slice(0, 5);

        // Low stock products (stock <= 10)
        const lowStockProducts = products
          .filter((p: any) => p.stock <= 10)
          .map((p: any) => ({
            productId: p.id,
            name: p.name,
            stock: p.stock
          }));

        setData({
          date: new Date().toISOString(),
          revenueToday,
          orderCountByStatus,
          top5Products,
          lowStockProducts,
          partial: false,
          failedParts: []
        });

      } catch (err: any) {
        setError(err.message || "Failed to fetch dashboard data");
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const columns = [
    {
      title: "Tên sản phẩm",
      dataIndex: "name",
      key: "name",
      render: (text: string) => <strong>{text}</strong>,
    },
    {
      title: "Đã bán",
      dataIndex: "quantitySold",
      key: "quantitySold",
    },
    {
      title: "Trạng thái",
      key: "status",
      render: () => <Tag color="success">Còn hàng</Tag>,
    },
  ];

  const totalOrders = data ? Object.values(data.orderCountByStatus).reduce((a, b) => a + b, 0) : 0;
  const pendingOrders = data?.orderCountByStatus["PENDING"] || 0;

  return (
    <>
      {error && <Alert title={"Lỗi tải dữ liệu"} description={error} type="error" showIcon style={{ marginBottom: 24 }} />}
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 50 }}>
          <Spin size="large" />
        </div>
      ) : data ? (
        <>
          {data.partial && (
            <Alert title={`Some data failed to load: ${data.failedParts.join(', ')}`} type="warning" showIcon style={{ marginBottom: 24 }} />
          )}
          {/* Top Statistics */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={12} lg={6}>
              <Card 
                variant="borderless" 
                style={{ borderRadius: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.03)", height: "100%" }}
              >
                <Statistic
                  title={<Text type="secondary" style={{ fontSize: 13 }}>{"Doanh thu hôm nay"}</Text>}
                  value={data.revenueToday}
                  prefix={<DollarSign size={18} color="#1890ff" />}
                  suffix="₫"
                  styles={{ content: { color: "#1f1f1f", fontWeight: 600, fontSize: 20 } }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card 
                variant="borderless" 
                hoverable
                onClick={() => router.push("/admin/orders")}
                style={{ borderRadius: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.03)", height: "100%", cursor: "pointer" }}
              >
                <Statistic
                  title={<Text type="secondary" style={{ fontSize: 13 }}>{"Tổng số đơn hàng"}</Text>}
                  value={totalOrders}
                  prefix={<ShoppingCart size={18} color="#52c41a" />}
                  styles={{ content: { color: "#1f1f1f", fontWeight: 600, fontSize: 20 } }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card 
                variant="borderless" 
                hoverable
                onClick={() => router.push("/admin/orders")}
                style={{ borderRadius: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.03)", height: "100%", cursor: "pointer" }}
              >
                <Statistic
                  title={<Text type="secondary" style={{ fontSize: 13 }}>{"Đơn chờ xử lý"}</Text>}
                  value={pendingOrders}
                  prefix={<AlertCircle size={18} color="#faad14" />}
                  styles={{ content: { color: "#1f1f1f", fontWeight: 600, fontSize: 20 } }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card 
                variant="borderless" 
                hoverable
                onClick={() => router.push("/admin/products")}
                style={{ borderRadius: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.03)", height: "100%", cursor: "pointer" }}
              >
                <Statistic
                  title={<Text type="secondary" style={{ fontSize: 13 }}>{"Sắp hết hàng"}</Text>}
                  value={data.lowStockProducts.length}
                  prefix={<Package size={18} color="#ff4d4f" />}
                  styles={{ content: { color: "#1f1f1f", fontWeight: 600, fontSize: 20 } }}
                />
              </Card>
            </Col>
          </Row>

          {/* Top Products Table & Low Stock Alert */}
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={16}>
              <Card
                title={<Title level={5} style={{ margin: 0 }}>{"Top 5 sản phẩm bán chạy"}</Title>}
                variant="borderless"
                style={{ borderRadius: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.03)", height: "100%" }}
              >
                <Table
                  dataSource={data.top5Products.map(p => ({ ...p, key: p.productId }))}
                  columns={columns}
                  pagination={false}
                  rowClassName={() => 'table-row-hover'}
                  onRow={(record) => ({
                    onClick: () => router.push(`/admin/products?name=${encodeURIComponent(record.name)}`),
                    style: { cursor: "pointer" },
                  })}
                />
              </Card>
            </Col>
            <Col xs={24} lg={8}>
              <Card
                title={
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Title level={5} style={{ margin: 0 }}>{"Cảnh báo sắp hết hàng"}</Title>
                    <span 
                      style={{ fontSize: 12, color: "#1677ff", cursor: "pointer", fontWeight: 500 }}
                      onClick={() => router.push("/admin/products")}
                    >
                      Xem tất cả →
                    </span>
                  </div>
                }
                variant="borderless"
                style={{ borderRadius: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.03)", height: "100%" }}
              >
                {data.lowStockProducts.length > 0 ? (
                  data.lowStockProducts.map(p => (
                    <div 
                      key={p.productId} 
                      onClick={() => router.push(`/admin/products?name=${encodeURIComponent(p.name)}`)}
                      style={{ 
                        display: "flex", 
                        justifyContent: "space-between", 
                        alignItems: "center",
                        marginBottom: 10, 
                        padding: "8px 10px", 
                        borderRadius: 6,
                        borderBottom: "1px solid #f0f0f0",
                        cursor: "pointer",
                        transition: "background 0.2s"
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f5f5f5")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                    >
                      <Text strong style={{ color: "#1890ff", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {p.name}
                      </Text>
                      <Tag color="error">{p.stock} {"còn lại"}</Tag>
                    </div>
                  ))
                ) : (
                  <Text type="secondary">{"Tất cả sản phẩm đều đủ hàng"}</Text>
                )}
              </Card>
            </Col>
          </Row>
        </>
      ) : null}
    </>
  );
}
