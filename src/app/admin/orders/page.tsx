"use client";
import React, { useState, useEffect } from "react";
import { Typography, Card, Table, Select, Tabs, Button } from "antd";
import { PlusOutlined, ReloadOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { useOrders } from "@/features/orders/hooks";
import { apiClient } from "@/lib/api-client";
import dayjs from "dayjs";

const { Title, Text } = Typography;

// Danh sách Tabs hiển thị đầy đủ: PENDING, AWAITING_PAYMENT, CONFIRMED, PAID, CANCELLED
const TABS = [
  { key: "ALL", label: "Tất cả" },
  { key: "PENDING", label: "PENDING" },
  { key: "AWAITING_PAYMENT", label: "AWAITING_PAYMENT" },
  { key: "CONFIRMED", label: "CONFIRMED" },
  { key: "PAID", label: "PAID" },
  { key: "CANCELLED", label: "CANCELLED" },
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
  // - CONFIRMED: Đơn đã phê duyệt
  // - PENDING: Đơn chờ xử lý
  const resolveDisplayStatus = (order: any) => {
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
  });

  const rawOrders = pageData?.content || pageData || [];

  // Lọc hiển thị theo tab được chọn
  const orders = Array.isArray(rawOrders)
    ? rawOrders.filter((o: any) => {
      if (activeTab === "ALL") return true;
      const displaySt = resolveDisplayStatus(o);
      return displaySt === activeTab;
    })
    : [];

  const totalPages = Math.max(1, Math.ceil((pageData?.totalElements || orders.length) / size));

  const handleTabChange = (key: string) => {
    setActiveTab(key);
    setPage(0);
  };

  const getStatusStyle = (status: string, paymentStatus?: string, id?: number) => {
    const computedStatus = resolveDisplayStatus({ status, paymentStatus, id });

    let text = computedStatus;
    let borderColor = "#d9d9d9";
    let bg = "#f5f5f5";
    let color = "#333333";

    if (computedStatus === "CANCELLED") {
      text = "CANCELLED";
      borderColor = "#e67373";
      bg = "#fdf1f1";
      color = "#cf1322";
    } else if (computedStatus === "PAID") {
      text = "PAID";
      borderColor = "#52c41a";
      bg = "#eafff0";
      color = "#389e0d";
    } else if (computedStatus === "AWAITING_PAYMENT") {
      text = "AWAITING_PAYMENT";
      borderColor = "#faad14";
      bg = "#fffbe6";
      color = "#d48806";
    } else if (computedStatus === "CONFIRMED") {
      text = "CONFIRMED";
      borderColor = "#1677ff";
      bg = "#e6f4ff";
      color = "#0958d9";
    } else {
      text = "PENDING";
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
        <span style={{ color: "#1677ff", fontWeight: 500 }}>#{id}</span>
      ),
    },
    {
      title: "Khách hàng",
      key: "customer",
      render: (_: any, record: any) => (
        <Text style={{ color: "#262626" }}>{record.customerName || record.customer?.name || "Khách vãng lai"}</Text>
      ),
    },
    {
      title: "Tổng tiền (đ)",
      dataIndex: "totalAmount",
      key: "totalAmount",
      render: (amount: number) => (
        <Text style={{ color: "#262626" }}>{Number(amount || 0).toLocaleString("vi-VN")}</Text>
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
            style={{
              display: "inline-block",
              padding: "2px 18px",
              borderRadius: "999px",
              border: `1.5px solid ${borderColor}`,
              backgroundColor: bg,
              color: color,
              fontSize: 13,
              fontWeight: 500,
              lineHeight: "1.4",
            }}
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
        <Text style={{ color: "#262626" }}>
          {date ? dayjs(date).format("DD/MM/YYYY HH:mm") : "-"}
        </Text>
      ),
    },
  ];

  return (
    <Card
      style={{
        borderRadius: 12,
        border: "1px solid #dcdfe6",
        boxShadow: "none",
      }}
      styles={{ body: { padding: "20px 24px" } }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <Title level={4} style={{ margin: 0, fontWeight: 700, fontSize: 18, color: "#1f1f1f" }}>
          Quản lý đơn hàng
        </Title>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Select
            allowClear
            value={selectedCustomer}
            placeholder="Khách hàng: Tất cả"
            onChange={(val) => {
              setSelectedCustomer(val);
              setPage(0);
            }}
            style={{ width: 200, height: 40 }}
            options={[
              { value: null, label: "Khách hàng: Tất cả" },
              ...customers.map((c) => ({
                value: c.id,
                label: `Khách hàng: ${c.name || c.username || c.email}`,
              })),
            ]}
          />
          {/* <Button
            icon={<ReloadOutlined />}
            onClick={() => refetch()}
            loading={loading}
            style={{ height: 40, padding: "0 16px" }}
          >
            Làm mới
          </Button> */}
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => router.push("/admin/orders/create")}
            style={{ width: 200, height: 40 }}
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
        style={{ marginBottom: 12 }}
      />

      {/* Table */}
      <Table
        columns={columns}
        dataSource={orders.map((o: any) => ({ ...o, key: o.id }))}
        loading={loading}
        pagination={false}
        onRow={(record) => ({
          onClick: () => router.push(`/admin/orders/${record.id}`),
          style: { cursor: "pointer" },
        })}
      />

      {/* Footer / Pagination */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: 18,
          fontSize: 14,
        }}
      >
        <Text type="secondary" style={{ color: "#595959" }} />

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ color: "#595959", display: "inline-flex", alignItems: "center", gap: 6 }}>
            <span
              onClick={() => page > 0 && setPage(page - 1)}
              style={{
                cursor: page > 0 ? "pointer" : "not-allowed",
                opacity: page > 0 ? 1 : 0.4,
              }}
            >
              ‹
            </span>
            <span>{page + 1}</span>
            <span
              onClick={() => page + 1 < totalPages && setPage(page + 1)}
              style={{
                cursor: page + 1 < totalPages ? "pointer" : "not-allowed",
                opacity: page + 1 < totalPages ? 1 : 0.4,
              }}
            >
              ›
            </span>
            <span style={{ margin: "0 2px" }}>·</span>
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
            style={{ width: 105, padding: 0 }}
          />
        </div>
      </div>
    </Card>
  );
}