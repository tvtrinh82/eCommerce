"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, Typography, Button, Modal, Timeline, Table, message, Spin } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { apiClient } from "@/lib/api-client";
import dayjs from "dayjs";

const { Title, Text } = Typography;

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params?.id;

  const [order, setOrder] = useState<any>(null);
  const [ticket, setTicket] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // 1. Fetch dữ liệu đơn hàng
  const fetchOrderDetail = useCallback(async () => {
    if (!orderId) return;
    try {
      setLoading(true);
      const res: any = await apiClient.get(`/orders/${orderId}`);
      const orderData = res.data || res;
      if (orderData && !orderData.customerEmail && orderData.customerId) {
        try {
          const custRes: any = await apiClient.get(`/customers/${orderData.customerId}`);
          const custData = custRes.data?.data || custRes.data;
          if (custData?.email) {
            orderData.customerEmail = custData.email;
          }
        } catch (e) {
          // ignore
        }
      }
      setOrder(orderData);
      try {
        const ticketRes: any = await apiClient.get(`/tickets/order/${orderId}`);
        setTicket(ticketRes.data?.data || ticketRes.data);
      } catch (err) {
        setTicket(null);
      }
    } catch (err: any) {
      message.error("Không thể tải thông tin đơn hàng");
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrderDetail();
  }, [fetchOrderDetail]);

  const handleTicketAction = (actionType: 'approve' | 'reject', actionLabel: string) => {
    Modal.confirm({
      title: "Xác nhận thao tác",
      content: `Bạn có chắc chắn muốn ${actionLabel} không?`,
      okText: "Đồng ý",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          setSubmitting(true);
          const requestBody = actionType === 'reject' ? { comment: 'Từ chối đơn hàng' } : {};
          const targetTicket = ticket || (await apiClient.get(`/tickets/order/${orderId}`)).data?.data;
          await apiClient.post(`/tickets/${targetTicket.id}/${actionType}`, requestBody);
          message.success(`${actionLabel} thành công`);
          await fetchOrderDetail();
        } catch (err: any) {
          message.error(err?.response?.data?.message || `Thao tác thất bại, vui lòng thử lại!`);
        } finally {
          setSubmitting(false);
        }
      },
    });
  };

  // 2. Xử lý đổi trạng thái (Hỏi xác nhận trước khi gửi -> Bắt lỗi BE -> Tải lại đơn)
  const handleStatusChange = (nextStatus: string, actionLabel: string) => {
    Modal.confirm({
      title: "Xác nhận đổi trạng thái",
      content: `Bạn có chắc chắn muốn chuyển đơn hàng sang trạng thái "${actionLabel}" không?`,
      okText: "Đồng ý",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          setSubmitting(true);
          await apiClient.patch(`/orders/${orderId}/status`, { status: nextStatus });
          message.success("Cập nhật trạng thái thành công");
          await fetchOrderDetail();
        } catch (err: any) {
          // BE từ chối bước chuyển -> hiện lỗi, tải lại đơn
          message.error(
            err?.response?.data?.message || "Chuyển trạng thái thất bại, vui lòng thử lại!"
          );
          await fetchOrderDetail();
        } finally {
          setSubmitting(false);
        }
      },
    });
  };

  if (loading && !order) {
    return (
      <div style={{ textAlign: "center", padding: "60px 0" }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!order) {
    return <Text type="secondary">Không tìm thấy đơn hàng.</Text>;
  }

  // Xác định trạng thái thực tế
  const currentStatus = order.status;

  // Cấu hình hiển thị Tag trạng thái ở Header: COMPLETED , CONFIRMED 
  const getBadgeStyle = (status: string) => {
    switch (status) {
      case "COMPLETED":
      case "PAID":
        // Xanh lá (Green)
        return { border: "#52c41a", bg: "#f6ffed", color: "#389e0d" };
      case "CONFIRMED":
      case "PROCESSING":
        // Xanh dương (Blue)
        return { border: "#1677ff", bg: "#e6f4ff", color: "#0958d9" };
      case "CANCELLED":
        // Đỏ (Red)
        return { border: "#ff4d4f", bg: "#fff1f0", color: "#cf1322" };
      case "PENDING":
        // Xám trung tính (Neutral)
        return { border: "#d9d9d9", bg: "#fafafa", color: "#595959" };
      case "AWAITING_PAYMENT":
        // Vàng cam (Orange/Gold)
        return { border: "#faad14", bg: "#fffbe6", color: "#d48806" };
      default:
        return { border: "#d9d9d9", bg: "#fafafa", color: "#595959" };
    }
  };

  const badgeStyle = getBadgeStyle(currentStatus);

  // Cấu hình Nút hành động theo trạng thái
  const renderActionButton = () => {
    if (currentStatus === "CONFIRMED" || currentStatus === "PROCESSING") {
      return (
        <Button
          type="primary"
          style={{ borderRadius: 8, height: 38, padding: "0 20px", fontWeight: 600 }}
          loading={submitting}
          onClick={() => handleStatusChange("COMPLETED", "Hoàn thành")}
        >
          Hoàn thành
        </Button>
      );
    }
    if (currentStatus === "PENDING") {
      const approveText = "Duyệt đơn";
      return (
        <>
          <Button
            danger
            style={{ borderRadius: 8, height: 38, padding: "0 20px", fontWeight: 600 }}
            loading={submitting}
            onClick={() => handleTicketAction('reject', 'Từ chối đơn hàng')}
          >
            Từ chối
          </Button>
          <Button
            type="primary"
            style={{ borderRadius: 8, height: 38, padding: "0 20px", fontWeight: 600 }}
            loading={submitting}
            onClick={() => handleTicketAction('approve', approveText)}
          >
            {approveText}
          </Button>
        </>
      );
    }
    return null; // Trạng thái khác: không có nút
  };

  // Cột cho bảng sản phẩm (Read-only giống B2)
  const productColumns = [
    {
      title: "Sản phẩm",
      dataIndex: "productName",
      key: "productName",
      render: (text: string, item: any) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {item.imageUrl ? (
            <img src={item.imageUrl} alt={text} style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4 }} />
          ) : (
            <div style={{ width: 40, height: 40, backgroundColor: '#f0f0f0', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 10, color: '#999' }}>No img</span>
            </div>
          )}
          <span>{text || item.name || "Sản phẩm"}</span>
        </div>
      ),
    },
    {
      title: "Đơn giá",
      key: "unitPrice",
      render: (_: any, item: any) => {
        const p = item.unitPrice || item.price || 0;
        return `${p.toLocaleString("vi-VN")} đ`;
      }
    },
    {
      title: "Số lượng",
      dataIndex: "quantity",
      key: "quantity",
      align: "center" as const,
    },
    {
      title: "Thành tiền",
      key: "subtotal",
      align: "right" as const,
      render: (_: any, item: any) => {
        const sub = item.subTotal || item.subtotal || ((item.unitPrice || item.price || 0) * (item.quantity || 1));
        return `${sub.toLocaleString("vi-VN")} đ`;
      }
    },
  ];

  const timelineLogs = order.statusLogs || [
    {
      fromStatus: "PENDING",
      toStatus: "AWAITING_PAYMENT",
      createdAt: order.createdAt || "2026-10-07T09:15:00",
    },
    {
      fromStatus: "AWAITING_PAYMENT",
      toStatus: "PAID",
      createdAt: order.paidAt || "2026-10-07T09:30:00",
    },
  ];

  return (
    <Card
      style={{
        borderRadius: 12,
        border: "1px solid #dcdfe6",
        boxShadow: "none",
        maxWidth: 1000,
        margin: "0 auto",
      }}
      styles={{ body: { padding: "24px 28px" } }}
    >
      {/* 1. Header Đơn hàng */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        {/* Khối bên trái: Mã đơn & Badge trạng thái */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Title level={4} style={{ margin: 0, fontWeight: 700, fontSize: 20, color: "#1f1f1f" }}>
            Đơn hàng #{order.id}
          </Title>
          <span
            style={{
              padding: "2px 18px",
              borderRadius: 999,
              border: `1.5px solid ${badgeStyle.border}`,
              backgroundColor: badgeStyle.bg,
              color: badgeStyle.color,
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            {currentStatus}
          </span>
        </div>

        {/* Khối bên phải: Nút Thoát trước, Nút Duyệt đơn sau */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => router.back()}
            style={{ borderRadius: 8, height: 38 }}
          >
            Thoát
          </Button>
          {renderActionButton()}
        </div>
      </div>

      {/* 2. Grid 2 cột: Thông tin đơn & Lịch sử trạng thái */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1.2fr",
          gap: 20,
          alignItems: "stretch",
          marginBottom: 24,
        }}
      >
        {/* Khung Thông tin đơn */}
        <div
          style={{
            border: "1px solid #d9d9d9",
            borderRadius: 10,
            padding: "20px 24px",
            display: "flex",
            flexDirection: "column",
            gap: 12,
            fontSize: 15,
            color: "#1f1f1f",
          }}
        >
          <Title level={5} style={{ margin: 0, marginBottom: 4, fontWeight: 700 }}>
            Thông tin đơn
          </Title>
          <div>
            Khách hàng:{" "}
            <span style={{ color: "#262626" }}>{order.customerName || "—"}</span>
          </div>
          <div>
            Email:{" "}
            <span style={{ color: "#262626" }}>
              {order.customerEmail || "—"}
            </span>
          </div>
          <div>
            Tổng tiền:{" "}
            <span style={{ color: "#262626" }}>
              {(order.totalAmount || 0).toLocaleString("vi-VN")} đ
            </span>
          </div>
          {order.paidAt && (
            <div>
              Thanh toán lúc:{" "}
              <span style={{ color: "#262626" }}>
                {dayjs(order.paidAt).format("DD/MM/YYYY HH:mm")}
              </span>
            </div>
          )}
          <div>
            Sản phẩm:{" "}
            <span style={{ color: "#262626" }}>
              {order.itemsSummary ||
                (order.items?.length
                  ? order.items.map((i: any) => `${i.productName} × ${i.quantity}`).join(", ")
                  : "iPhone 16 128GB × 2")}
            </span>
          </div>
        </div>

        {/* Khung Lịch sử trạng thái */}
        <div
          style={{
            border: "1px solid #d9d9d9",
            borderRadius: 10,
            padding: "20px 24px",
          }}
        >
          <Title level={5} style={{ margin: 0, marginBottom: 18, fontWeight: 700 }}>
            Lịch sử trạng thái
          </Title>

          <Timeline
            items={timelineLogs.map((log: any) => ({
              color: "#1677ff",
              children: (
                <div style={{ marginBottom: 6 }}>
                  <div style={{ fontWeight: 600, color: "#1f1f1f", fontSize: 14 }}>
                    {log.fromStatus} → {log.toStatus}
                  </div>
                  <div style={{ color: "#595959", fontSize: 13, marginTop: 2 }}>
                    {dayjs(log.createdAt).format("DD/MM/YYYY HH:mm")}
                  </div>
                </div>
              ),
            }))}
          />

          {/* Trường hợp hệ thống tự huỷ */}
          {order.cancelReason && (
            <div
              style={{
                marginTop: 12,
                paddingTop: 12,
                borderTop: "1px solid #f0f0f0",
                fontSize: 13,
                color: "#595959",
              }}
            >
              <div style={{ marginBottom: 4 }}>Đơn bị hệ thống tự huỷ hiện thêm:</div>
              <div style={{ fontWeight: 600, color: "#262626" }}>
                AWAITING_PAYMENT → CANCELLED
              </div>
              <div style={{ marginTop: 2 }}>
                Người đổi: SYSTEM · Lý do: {order.cancelReason || "PAYMENT_TIMEOUT"}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. Bảng danh sách sản phẩm (chỉ xem, giống B2) */}
      <div style={{ border: "1px solid #d9d9d9", borderRadius: 10, padding: 16 }}>
        <Title level={5} style={{ margin: "0 0 12px 0", fontWeight: 700 }}>
          Danh sách sản phẩm
        </Title>
        <Table
          columns={productColumns}
          dataSource={(order.items || []).map((item: any, idx: number) => ({
            ...item,
            key: item.id || idx,
          }))}
          pagination={false}
          size="small"
        />
      </div>
    </Card>
  );
}