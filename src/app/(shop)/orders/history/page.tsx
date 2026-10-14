"use client";

import React, { useEffect, useState } from "react";
import { Table, Tag, message, Button, Empty } from "antd";
import { EyeOutlined, ShoppingOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import { apiClient } from "@/lib/api-client";
import { formatCurrency } from "@/lib/format";
import { useThemeStore } from "@/store/themeStore";
import Header from "@/components/ecommerce/Header";
import Footer from "@/components/ecommerce/Footer";
import styles from "./OrderHistory.module.scss";

export default function OrderHistoryPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { isDarkMode } = useThemeStore();

  useEffect(() => {
    let isMounted = true;

    const fetchHistory = async (isInitial = false) => {
      if (isInitial) setLoading(true);
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) {
        if (isInitial) {
          message.warning("Vui lòng đăng nhập để xem lịch sử mua hàng");
          router.push("/auth/login");
        }
        return;
      }

      try {
        const resUser: any = await apiClient.get("/auth/me");
        const userData = resUser.data || resUser;
        const customerId = userData?.customerId || userData?.id;

        if (customerId && isMounted) {
          const resOrders: any = await apiClient.get(`/orders/customer/${customerId}`);
          const ordersData = resOrders.data?.content || resOrders.data || resOrders || [];
          const sorted = Array.isArray(ordersData) ? ordersData.sort((a, b) => b.id - a.id) : [];
          setOrders(sorted);
        }
      } catch (e: any) {
        if (isInitial) {
          console.error(e);
          message.error("Lỗi khi tải lịch sử mua hàng: " + (e?.message || ""));
        }
      } finally {
        if (isInitial && isMounted) {
          setLoading(false);
        }
      }
    };

    fetchHistory(true);

    const interval = setInterval(() => {
      fetchHistory(false);
    }, 4000);

    const handleFocus = () => {
      fetchHistory(false);
    };
    window.addEventListener("focus", handleFocus);

    return () => {
      isMounted = false;
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, [router]);

  const columns = [
    {
      title: "Mã đơn",
      dataIndex: "id",
      key: "id",
      width: 100,
      render: (id: number) => <span className={styles.orderIdText}>#{id}</span>,
    },
    {
      title: "Ngày đặt",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 160,
      render: (date: string, record: any) => {
        const d = date || record.orderDate;
        return <span className={styles.dateText}>{d ? dayjs(d).format("DD/MM/YYYY HH:mm") : "-"}</span>;
      },
    },
    {
      title: "Sản phẩm",
      key: "products",
      render: (_: any, record: any) => {
        if (!record.items || record.items.length === 0)
          return <span className={styles.pendingProductText}>Đang cập nhật...</span>;
        return (
          <div className={styles.productsList}>
            {record.items.map((item: any, idx: number) => (
              <div key={idx} className={styles.productLine}>
                • {item.productName || item.name} <strong>(×{item.quantity})</strong>
              </div>
            ))}
          </div>
        );
      },
    },
    {
      title: "Tổng tiền",
      dataIndex: "totalAmount",
      key: "totalAmount",
      width: 150,
      render: (amount: number) =>
        amount ? <strong className={styles.amountText}>{formatCurrency(amount)}</strong> : "-",
    },
    {
      title: "Trạng thái đơn",
      dataIndex: "status",
      key: "status",
      width: 140,
      render: (status: string, record: any) => {
        const st = status || record.orderStatus || "PENDING";
        let color = "blue";
        let label = "Chờ duyệt";
        if (st === "COMPLETED") { color = "green"; label = "Hoàn thành"; }
        else if (st === "CANCELLED") { color = "red"; label = "Đã hủy"; }
        else if (st === "PENDING") { color = "orange"; label = "Chờ duyệt"; }
        else if (st === "AWAITING_PAYMENT") { color = "gold"; label = "Chờ thanh toán"; }
        else if (st === "PAID") { color = "green"; label = "Đã thanh toán"; }
        else if (st === "CONFIRMED") { color = "processing"; label = "Đã xác nhận"; }
        else if (st === "PROCESSING") { color = "blue"; label = "Đang xử lý / Giao"; }
        else if (st === "REFUND_REQUESTED") { color = "purple"; label = "Yêu cầu hoàn tiền"; }
        else if (st === "REFUNDED") { color = "default"; label = "Đã hoàn tiền"; }
        return <Tag color={color} className={styles.statusTag}>{label}</Tag>;
      },
    },
    {
      title: "Thanh toán",
      dataIndex: "paymentStatus",
      key: "paymentStatus",
      width: 140,
      render: (status: string) => {
        const st = status || "PENDING";
        let color = "blue";
        let label = "Chưa thanh toán";
        if (st === "PAID" || st === "SUCCESS") { color = "green"; label = "Đã thanh toán"; }
        else if (st === "FAILED") { color = "red"; label = "Thất bại"; }
        else if (st === "CANCELLED") { color = "red"; label = "Đã hủy"; }
        else if (st === "PENDING" || st === "UNPAID") { color = "orange"; label = "Chưa thanh toán"; }
        else if (st === "REFUNDED") { color = "default"; label = "Đã hoàn tiền"; }
        return <Tag color={color} className={styles.statusTag}>{label}</Tag>;
      },
    },
    {
      title: "Thao tác",
      key: "action",
      width: 110,
      render: (_: any, record: any) => (
        <Button
          type="primary"
          icon={<EyeOutlined />}
          onClick={() => router.push(`/orders/${record.id}`)}
          size="middle"
          className={styles.detailBtn}
        >
          Chi tiết
        </Button>
      ),
    },
  ];

  return (
    <div className={`${styles.pageRoot} ${isDarkMode ? styles.darkMode : ""}`}>
      {/* Header chuẩn eCommerce */}
      <Header />

      <main className={styles.main}>
        <div className={styles.container}>
          {/* Top Bar */}
          <div className={styles.topBar}>
            <button className={styles.backBtn} onClick={() => router.push("/")}>
              <ArrowLeftOutlined />
              <span>Tiếp tục mua hàng</span>
            </button>

            <div className={styles.headerRow}>
              <h1 className={styles.pageTitle}>
                <ShoppingOutlined style={{ color: "#1677ff" }} /> Lịch sử mua hàng
                <span className={styles.countTag}>({orders.length} đơn)</span>
              </h1>

              <Button type="primary" onClick={() => router.push("/orders/new")}>
                + Tạo đơn đặt hàng mới
              </Button>
            </div>
          </div>

          {/* Bảng danh sách đơn hàng */}
          <div className={styles.tableCard}>
            <Table
              className={styles.orderTable}
              columns={columns}
              dataSource={orders.map((o) => ({ ...o, key: o.id }))}
              loading={loading}
              pagination={{ pageSize: 10, showSizeChanger: false }}
              scroll={{ x: 800 }}
              locale={{
                emptyText: (
                  <div className={styles.emptyBox}>
                    <Empty
                      description="Bạn chưa có đơn hàng nào trong lịch sử"
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                    >
                      <Button type="primary" onClick={() => router.push("/")}>
                        Khám phá sản phẩm ngay
                      </Button>
                    </Empty>
                  </div>
                ),
              }}
            />
          </div>
        </div>
      </main>

      {/* Footer chuẩn eCommerce */}
      <Footer />
    </div>
  );
}
