"use client";
import React, { useState, useEffect } from "react";
import { Typography, Card, Table, Select, Tabs, Button } from "antd";
import { PlusOutlined, ReloadOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { useOrders } from "@/features/orders/hooks";
import { apiClient } from "@/lib/api-client";
import dayjs from "dayjs";
import styles from "./Order.module.scss";

const { Title, Text } = Typography;

// Danh sách Tabs hiển thị đầy đủ theo trạng thái tiếng Việt
const TABS = [
  { key: "ALL", label: "Tất cả" },
  { key: "PENDING", label: "Chờ duyệt" },
  { key: "AWAITING_PAYMENT", label: "Chờ thanh toán" },
  { key: "CONFIRMED", label: "Đã xác nhận" },
  { key: "PAID", label: "Đã thanh toán" },
  { key: "CANCELLED", label: "Đã hủy" },
];

export default function OrdersPage() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("ALL");
  const [selectedCustomer, setSelectedCustomer] = useState<number | null>(null);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const [customers, setCustomers] = useState<any[]>([]);

  useEffect(() => {
    // Fetch all customers for the filter dropdown
    apiClient
      .get("/customers?page=0&size=1000")
      .then((res: any) => {
        const data = res.data?.content || res.data || res.content || [];
        const filtered = (Array.isArray(data) ? data : []).filter(
          (c: any) =>
            !c.email?.toLowerCase().includes("admin") &&
            !c.name?.toLowerCase().includes("admin") &&
            c.role !== "ADMIN"
        );
        setCustomers(filtered);
      })
      .catch(console.error);
  }, []);

  // Phân loại và hiển thị trạng thái chính xác:
  // - CANCELLED: Đã hủy
  // - PAID: Đơn có paymentStatus === 'PAID' hoặc status === 'COMPLETED' hoặc status === 'PROCESSING'
  // - AWAITING_PAYMENT: Chỉ khi paymentStatus === 'PENDING' hoặc status === 'AWAITING_PAYMENT'
  // Phân loại và hiển thị trạng thái chính xác
  const resolveDisplayStatus = (order: any): string => {
    if (!order) return "PENDING";
    if (order.status === "CANCELLED") return "CANCELLED";

    // 1. Đơn ĐÃ THANH TOÁN (PAID)
    if (
      order.paymentStatus === "PAID" ||
      order.status === "PAID" ||
      order.status === "COMPLETED" ||
      order.status === "PROCESSING"
    ) {
      return "PAID";
    }

    // 2. Đơn CHỜ THANH TOÁN (AWAITING_PAYMENT)
    if (order.paymentStatus === "PENDING" || order.status === "AWAITING_PAYMENT") {
      return "AWAITING_PAYMENT";
    }

    // 3. Đơn ĐÃ DUYỆT (CONFIRMED)
    if (order.status === "CONFIRMED") {
      return "CONFIRMED";
    }

    // 4. Mặc định là PENDING
    return "PENDING";
  };

  // Logic gọi API:
  // - ALL / PAID / AWAITING_PAYMENT: Không truyền param status lên BE để lấy đủ danh sách, sau đó FE lọc theo resolveDisplayStatus
  // - PENDING / CONFIRMED / CANCELLED: Truyền trực tiếp status lên BE
  const queryStatus =
    activeTab === "ALL" || activeTab === "PAID" || activeTab === "AWAITING_PAYMENT"
      ? undefined
      : activeTab;

  const { data: pageData, isLoading: loading, refetch } = useOrders({
    page,
    size,
    status: queryStatus,
    customerId: selectedCustomer || undefined,
    sort: "id,desc",
  });

  // Backend trả về: res.data (ApiResponse) chứa data (PageResponse) chứa content (List<OrderResponse>)
  // apiClient interceptor trả về response.data. Do đó pageData có thể là { data: { content: [...] } } hoặc { content: [...] } hoặc mảng []
  const rawOrders =
    pageData?.data?.content ||
    pageData?.content ||
    pageData?.data ||
    (Array.isArray(pageData) ? pageData : []);

  // Lọc hiển thị theo tab được chọn và sắp xếp ID giảm dần (đơn mới nhất lên đầu)
  const orders = (Array.isArray(rawOrders) ? rawOrders : [])
    .filter((o: any) => {
      if (activeTab === "ALL") return true;
      const displaySt = resolveDisplayStatus(o);
      return displaySt === activeTab;
    })
    .sort((a: any, b: any) => (b.id || 0) - (a.id || 0));

  const totalElements = pageData?.data?.totalElements || pageData?.totalElements || orders.length;
  const totalPages = Math.max(1, Math.ceil(totalElements / size));

  const handleTabChange = (key: string) => {
    setActiveTab(key);
    setPage(0);
  };

  const getStatusStyle = (status: string, paymentStatus?: string, id?: number) => {
    const computedStatus = resolveDisplayStatus({ status, paymentStatus, id });

    let text = "Chờ duyệt";
    let borderColor = "#d9d9d9";
    let bg = "#f5f5f5";
    let color = "#333333";

    if (computedStatus === "CANCELLED") {
      text = "Đã hủy";
      borderColor = "#e67373";
      bg = "#fdf1f1";
      color = "#cf1322";
    } else if (computedStatus === "PAID") {
      text = "Đã thanh toán";
      borderColor = "#52c41a";
      bg = "#eafff0";
      color = "#389e0d";
    } else if (computedStatus === "AWAITING_PAYMENT") {
      text = "Chờ thanh toán";
      borderColor = "#faad14";
      bg = "#fffbe6";
      color = "#d48806";
    } else if (computedStatus === "CONFIRMED") {
      text = "Đã xác nhận";
      borderColor = "#1677ff";
      bg = "#e6f4ff";
      color = "#0958d9";
    } else if (computedStatus === "PROCESSING") {
      text = "Đang xử lý / Giao";
      borderColor = "#1677ff";
      bg = "#e6f4ff";
      color = "#0958d9";
    } else if (computedStatus === "COMPLETED") {
      text = "Hoàn thành";
      borderColor = "#13c2c2";
      bg = "#e6fffb";
      color = "#08979c";
    } else if (computedStatus === "REFUND_REQUESTED") {
      text = "Yêu cầu hoàn tiền";
      borderColor = "#722ed1";
      bg = "#f9f0ff";
      color = "#531dab";
    } else if (computedStatus === "REFUNDED") {
      text = "Đã hoàn tiền";
      borderColor = "#8c8c8c";
      bg = "#f5f5f5";
      color = "#595959";
    } else {
      text = "Chờ duyệt";
      borderColor = "#d9d9d9";
      bg = "#f5f5f5";
      color = "#595959";
    }

    return { text, borderColor, bg, color };
  };

  const columns = [
    {
      title: "Mã đơn",
      dataIndex: "id",
      key: "id",
      width: 110,
      render: (id: number) => (
        <span className={styles.orderId}>#{id}</span>
      ),
    },
    {
      title: "Khách hàng",
      key: "customer",
      render: (_: any, record: any) => {
        const name = record.customerName || record.customer?.name || record.customer?.fullName || record.customer?.username || "Khách vãng lai";
        return (
          <span className={styles.customerText} title={name}>
            {name}
          </span>
        );
      },
    },
    {
      title: "Tổng tiền (đ)",
      dataIndex: "totalAmount",
      key: "totalAmount",
      render: (amount: number) => (
        <Text className={styles.totalText}>{Number(amount || 0).toLocaleString("vi-VN")}</Text>
      ),
    },
    {
      title: "Trạng thái",
      key: "status",
      render: (_: any, record: any) => {
        const { text, borderColor, bg, color } = getStatusStyle(
          record.status,
          record.paymentStatus,
          record.id
        );

        return (
          <span
            className={styles.statusBadge}
            style={
              {
                "--badge-border": borderColor,
                "--badge-bg": bg,
                "--badge-color": color,
              } as React.CSSProperties
            }
          >
            {text}
          </span>
        );
      },
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: string) => (
        <Text className={styles.dateText}>
          {date ? dayjs(date).format("DD/MM/YYYY HH:mm") : "-"}
        </Text>
      ),
    },
  ];

  return (
    <Card
      className={styles.card}
      styles={{ body: { padding: "20px 24px" } }}
    >
      {/* Header */}
      <div className={styles.headerRow}>
        <Title level={4} className={styles.pageTitle}>
          Quản lý đơn hàng
        </Title>
        <div className={styles.headerActions}>
          <Select
            allowClear
            value={selectedCustomer ?? undefined}
            placeholder="Khách hàng: Tất cả"
            onChange={(val) => {
              setSelectedCustomer(val ? Number(val) : null);
              setPage(0);
            }}
            className={styles.customerSelect}
            options={[
              { value: "", label: "Khách hàng: Tất cả" },
              ...customers.map((c) => ({
                value: c.id,
                label: `Khách hàng: ${c.name || c.username || c.email}`,
              })),
            ]}
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => router.push("/admin/orders/create")}
            className={styles.createBtn}
          >
            Tạo mới đơn hàng
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        activeKey={activeTab}
        onChange={handleTabChange}
        items={TABS}
        className={styles.orderTabs}
      />

      {/* Table */}
      <Table
        columns={columns}
        dataSource={orders.map((o: any) => ({ ...o, key: o.id }))}
        loading={loading}
        pagination={false}
        onRow={(record) => ({
          onClick: () => router.push(`/admin/orders/${record.id}`),
          className: styles.tableRowClickable,
        })}
      />

      {/* Footer / Pagination */}
      <div className={styles.footerRow}>
        <Text type="secondary" />

        <div className={styles.paginationWrap}>
          <span className={styles.paginationControls}>
            <span
              onClick={() => page > 0 && setPage(page - 1)}
              className={`${styles.pageArrow} ${page <= 0 ? styles.disabled : ""}`}
            >
              ‹
            </span>
            <span>{page + 1}</span>
            <span
              onClick={() => page + 1 < totalPages && setPage(page + 1)}
              className={`${styles.pageArrow} ${page + 1 >= totalPages ? styles.disabled : ""}`}
            >
              ›
            </span>
            <span className={styles.pageDot}>·</span>
          </span>

          <Select
            size="small"
            variant="borderless"
            value={size}
            onChange={(val) => {
              setSize(val);
              setPage(0);
            }}
            options={[
              { value: 10, label: "10 / trang" },
              { value: 20, label: "20 / trang" },
              { value: 50, label: "50 / trang" },
            ]}
            className={styles.pageSizeSelect}
          />
        </div>
      </div>
    </Card>
  );
}