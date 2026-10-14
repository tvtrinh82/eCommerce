"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, Typography, Button, Modal, Timeline, Table, message, Spin } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { apiClient } from "@/lib/api-client";
import dayjs from "dayjs";
import styles from "./OrderDetail.module.scss";

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

      // Đảm bảo lấy được ảnh sản phẩm cho từng sản phẩm trong đơn hàng
      if (orderData && Array.isArray(orderData.items) && orderData.items.length > 0) {
        try {
          const itemsWithImages = await Promise.all(
            orderData.items.map(async (item: any) => {
              if (item.imageUrl || item.image || item.image_url) {
                return {
                  ...item,
                  imageUrl: item.imageUrl || item.image || item.image_url,
                };
              }
              const pId = item.productId || item.id;
              if (pId) {
                try {
                  const prodRes: any = await apiClient.get(`/products/${pId}`);
                  const prodData = prodRes.data?.data || prodRes.data || prodRes;
                  const img = prodData?.imageUrl || prodData?.image || prodData?.image_url;
                  return {
                    ...item,
                    imageUrl: img || null,
                  };
                } catch {
                  return item;
                }
              }
              return item;
            })
          );
          orderData.items = itemsWithImages;
        } catch (imgErr) {
          console.error("Lỗi khi tải ảnh sản phẩm:", imgErr);
        }
      }

      setOrder(orderData);
      try {
        // Lấy ticket theo orderId trước
        const ticketRes: any = await apiClient.get(`/tickets/order/${orderId}`).catch(() => null);
        let foundTicket = ticketRes?.data?.data || ticketRes?.data || ticketRes;
        
        if (!foundTicket || !foundTicket.id) {
          // Fallback tìm trong inbox
          const inboxRes: any = await apiClient.get(`/tickets/inbox?page=0&size=100`).catch(() => null);
          const inboxTickets =
            inboxRes?.data?.content ||
            inboxRes?.content ||
            inboxRes?.data ||
            (Array.isArray(inboxRes) ? inboxRes : []);
          foundTicket = (Array.isArray(inboxTickets) ? inboxTickets : []).find(
            (t: any) => String(t.orderId) === String(orderId)
          );
        }
        setTicket(foundTicket || null);
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
          let targetTicket = ticket;
          if (!targetTicket?.id) {
            // Thử tìm lại qua inbox
            const inboxRes: any = await apiClient.get(`/tickets/inbox?page=0&size=100`);
            const inboxTickets =
              inboxRes?.data?.content ||
              inboxRes?.content ||
              inboxRes?.data ||
              (Array.isArray(inboxRes) ? inboxRes : []);
            targetTicket = (Array.isArray(inboxTickets) ? inboxTickets : []).find(
              (t: any) => String(t.orderId) === String(orderId)
            );
          }
          if (!targetTicket?.id) {
            message.warning("Đơn hàng này không có phiếu chờ duyệt trong hộp thư của bạn (hoặc cần quyền Product Owner duyệt trước).");
            return;
          }
          await apiClient.post(`/tickets/${targetTicket.id}/${actionType}`, requestBody);
          message.success(`${actionLabel} thành công`);
          await fetchOrderDetail();
        } catch (err: any) {
          message.error(err?.response?.data?.message || err?.message || `Thao tác thất bại, vui lòng thử lại!`);
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
      <div className={styles.loadingWrap}>
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
          className={styles.actionBtn}
          loading={submitting}
          onClick={() => handleStatusChange("COMPLETED", "Hoàn thành")}
        >
          Hoàn thành
        </Button>
      );
    }
    // Nếu đơn hàng đang PENDING nhưng vé đã được duyệt (APPROVED) thì không hiện nút duyệt đơn nữa
    if (ticket && ticket.status === "APPROVED") {
      return null;
    }

    if (currentStatus === "PENDING") {
      // Nếu vé đã bị REJECTED, CANCELLED hoặc EXPIRED thì cũng không hiện nút duyệt
      if (ticket && ticket.status !== "PENDING_APPROVAL" && ticket.status !== "PENDING_PO_APPROVE" && ticket.status !== "PENDING_AD_APPROVE") {
        return null;
      }

      const approveText = "Duyệt đơn";
      return (
        <>
          <Button
            danger
            className={styles.actionBtn}
            loading={submitting}
            onClick={() => handleTicketAction('reject', 'Từ chối đơn hàng')}
          >
            Từ chối
          </Button>
          <Button
            type="primary"
            className={styles.actionBtn}
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
      render: (text: string, item: any) => {
        const imgUrl = item.imageUrl || item.image || item.image_url;
        return (
          <div className={styles.productCell}>
            {imgUrl ? (
              <img
                src={imgUrl}
                alt={text || "Ảnh sản phẩm"}
                className={styles.productImg}
                onError={(e: any) => {
                  e.currentTarget.style.display = "none";
                  if (e.currentTarget.nextSibling) {
                    e.currentTarget.nextSibling.style.display = "flex";
                  }
                }}
              />
            ) : null}
            <div
              className={styles.noImgBox}
              style={{ display: imgUrl ? "none" : "flex" }}
            >
              <span className={styles.noImgText}>SP</span>
            </div>
            <span style={{ fontWeight: 600, fontSize: 15 }}>{text || item.name || "Sản phẩm"}</span>
          </div>
        );
      },
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
      className={styles.card}
      styles={{ body: { padding: "24px 28px" } }}
    >
      {/* 1. Header Đơn hàng */}
      <div className={styles.headerRow}>
        {/* Khối bên trái: Mã đơn & Badge trạng thái */}
        <div className={styles.headerLeft}>
          <Title level={4} className={styles.pageTitle}>
            Đơn hàng #{order.id}
          </Title>
          <span
            className={styles.statusBadge}
            style={
              {
                "--badge-border": badgeStyle.border,
                "--badge-bg": badgeStyle.bg,
                "--badge-color": badgeStyle.color,
              } as React.CSSProperties
            }
          >
            {currentStatus === "COMPLETED"
              ? "Hoàn thành"
              : currentStatus === "CANCELLED"
              ? "Đã hủy"
              : currentStatus === "PAID"
              ? "Đã thanh toán"
              : currentStatus === "CONFIRMED"
              ? "Đã xác nhận"
              : currentStatus === "PROCESSING"
              ? "Đang xử lý / Giao"
              : currentStatus === "AWAITING_PAYMENT"
              ? "Chờ thanh toán"
              : currentStatus === "REFUND_REQUESTED"
              ? "Yêu cầu hoàn tiền"
              : currentStatus === "REFUNDED"
              ? "Đã hoàn tiền"
              : "Chờ duyệt"}
          </span>
        </div>

        {/* Khối bên phải: Nút Thoát trước, Nút Duyệt đơn sau */}
        <div className={styles.headerRight}>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => router.back()}
            className={styles.exitBtn}
          >
            Quay lại
          </Button>
          {renderActionButton()}
        </div>
      </div>

      {/* 2. Grid 2 cột: Thông tin đơn & Lịch sử trạng thái */}
      <div className={styles.infoGrid}>
        {/* Khung Thông tin đơn */}
        <div className={styles.orderInfoCard}>
          <Title level={5} className={styles.cardTitle}>
            Thông tin đơn
          </Title>
          <div>
            Khách hàng:{" "}
            <span className={styles.infoValue}>{order.customerName || "—"}</span>
          </div>
          <div>
            Email:{" "}
            <span className={styles.infoValue}>
              {order.customerEmail || "—"}
            </span>
          </div>
          <div>
            Tổng tiền:{" "}
            <span className={styles.infoValue}>
              {(order.totalAmount || 0).toLocaleString("vi-VN")} đ
            </span>
          </div>
          {order.paidAt && (
            <div>
              Thanh toán lúc:{" "}
              <span className={styles.infoValue}>
                {dayjs(order.paidAt).format("DD/MM/YYYY HH:mm")}
              </span>
            </div>
          )}
          <div>
            Sản phẩm:{" "}
            <span className={styles.infoValue}>
              {order.itemsSummary ||
                (order.items?.length
                  ? order.items.map((i: any) => `${i.productName} × ${i.quantity}`).join(", ")
                  : "iPhone 16 128GB × 2")}
            </span>
          </div>
        </div>

        {/* Khung Lịch sử trạng thái */}
        <div className={styles.historyCard}>
          <Title level={5} className={styles.historyTitle}>
            Lịch sử trạng thái
          </Title>

          <Timeline
            items={timelineLogs.map((log: any) => ({
              color: "#1677ff",
              children: (
                <div className={styles.timelineItemWrap}>
                  <div className={styles.timelineTitle}>
                    {log.fromStatus} → {log.toStatus}
                  </div>
                  <div className={styles.timelineDate}>
                    {dayjs(log.createdAt).format("DD/MM/YYYY HH:mm")}
                  </div>
                </div>
              ),
            }))}
          />

          {/* Trường hợp hệ thống tự huỷ */}
          {order.cancelReason && (
            <div className={styles.cancelReasonBox}>
              <div className={styles.cancelHeader}>Đơn bị hệ thống tự huỷ hiện thêm:</div>
              <div className={styles.cancelStatus}>
                AWAITING_PAYMENT → CANCELLED
              </div>
              <div className={styles.cancelReason}>
                Người đổi: SYSTEM · Lý do: {order.cancelReason || "PAYMENT_TIMEOUT"}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. Bảng danh sách sản phẩm (chỉ xem, giống B2) */}
      <div className={styles.productsSection}>
        <Title level={5} className={styles.productsTitle}>
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