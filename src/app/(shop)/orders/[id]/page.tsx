"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Spin,
  Alert,
  Button,
  message,
  Row,
  Col,
  Popconfirm,
  Tag,
  Divider,
} from "antd";
import {
  ArrowLeftOutlined,
  CheckCircleFilled,
  ClockCircleFilled,
  CloseCircleFilled,
  SafetyCertificateOutlined,
  UserOutlined,
  CreditCardOutlined,
  ShoppingOutlined,
} from "@ant-design/icons";
import { useOrderDetail } from "@/features/orders/hooks";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { apiClient } from "@/lib/api-client";
import { useThemeStore } from "@/store/themeStore";
import Header from "@/components/ecommerce/Header";
import Footer from "@/components/ecommerce/Footer";
import styles from "./OrderDetailPage.module.scss";

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const { isDarkMode } = useThemeStore();

  const { data: order, isLoading, isError, error, refetch } = useOrderDetail(id);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState<any>(null);
  const [itemsWithImages, setItemsWithImages] = useState<any[]>([]);

  // Tải chi tiết ảnh cho từng sản phẩm trong đơn nếu thiếu
  useEffect(() => {
    if (order && Array.isArray(order.items)) {
      const fetchImages = async () => {
        const enriched = await Promise.all(
          order.items.map(async (item: any) => {
            if (item.imageUrl || item.image || item.image_url) {
              return {
                ...item,
                image: item.imageUrl || item.image || item.image_url,
              };
            }
            const pId = item.productId || item.id;
            if (pId) {
              try {
                const prodRes: any = await apiClient.get(`/products/${pId}`);
                const prodData = prodRes.data?.data || prodRes.data || prodRes;
                return {
                  ...item,
                  image: prodData?.imageUrl || prodData?.image || prodData?.image_url,
                };
              } catch {
                return item;
              }
            }
            return item;
          })
        );
        setItemsWithImages(enriched);
      };
      fetchImages();
    }
  }, [order]);

  // Fetch lịch sử thanh toán nếu đơn hàng đã thanh toán
  useEffect(() => {
    if (
      order &&
      (order.paymentStatus === "PAID" ||
        order.status === "PROCESSING" ||
        order.status === "COMPLETED")
    ) {
      const fetchPayment = async () => {
        try {
          const res: any = await apiClient.get(`/payments/vnpay/history/${order.id}`);
          const history = res.data?.data || res.data || [];
          if (Array.isArray(history) && history.length > 0) {
            const successTxn = history.find((h: any) => h.status === "SUCCESS") || history[0];
            setPaymentInfo(successTxn);
          }
        } catch (e) {
          // Silent fallback
        }
      };
      fetchPayment();
    }
  }, [order]);

  const [ticket, setTicket] = useState<any>(null);

  // Lấy thông tin vé duyệt PurchaseTicket liên quan đến đơn hàng này
  useEffect(() => {
    if (order?.id) {
      apiClient
        .get(`/tickets/order/${order.id}`)
        .then((res: any) => {
          const tData = res.data?.data || res.data || res;
          setTicket(tData);
        })
        .catch(() => {
          setTicket(null);
        });
    }
  }, [order?.id]);

  // Trạng thái chờ thanh toán
  const [isAwaitingPayment, setIsAwaitingPayment] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(`awaiting_payment_${id}`)) {
      setIsAwaitingPayment(true);
    }
  }, [id]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isAwaitingPayment && (order?.status === "PENDING" || order?.status === "AWAITING_PAYMENT" || order?.status === "CONFIRMED") && order?.paymentStatus !== "PAID") {
      timer = setInterval(() => {
        refetch();
      }, 3000);
    } else if (order?.paymentStatus === "PAID" || order?.status === "CANCELLED") {
      setIsAwaitingPayment(false);
      localStorage.removeItem(`awaiting_payment_${id}`);
    }
    return () => clearInterval(timer);
  }, [isAwaitingPayment, order, id, refetch]);

  if (isLoading) {
    return (
      <div className={`${styles.pageRoot} ${isDarkMode ? styles.darkMode : ""}`}>
        <Header />
        <div className={styles.loadingContainer}>
          <Spin size="large" tip="Đang tải chi tiết đơn hàng..." />
        </div>
        <Footer />
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className={`${styles.pageRoot} ${isDarkMode ? styles.darkMode : ""}`}>
        <Header />
        <div className={styles.errorContainer}>
          <Alert
            message="Lỗi tải đơn hàng"
            description={error?.message || "Không tìm thấy thông tin đơn hàng này trên hệ thống"}
            type="error"
            showIcon
          />
          <div style={{ marginTop: 20, textAlign: "center" }}>
            <Button type="primary" onClick={() => router.push("/orders/history")}>
              Quay lại danh sách đơn hàng
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const handlePayment = async () => {
    setPaymentLoading(true);
    try {
      // Gọi API checkout của Backend: POST /api/orders/{id}/checkout
      const idempotencyKey = `checkout_${order.id}_${Date.now()}`;
      const res: any = await apiClient.post(
        `/orders/${order.id}/checkout`,
        null,
        {
          headers: {
            "Idempotency-Key": idempotencyKey,
          },
        }
      );
      
      const resData = res?.data || res;
      const paymentUrl = resData?.paymentUrl || res?.paymentUrl;
      
      if (paymentUrl) {
        localStorage.setItem(`awaiting_payment_${order.id}`, "true");
        setIsAwaitingPayment(true);
        window.location.href = paymentUrl;
      } else {
        message.error("Không tìm thấy đường dẫn thanh toán từ hệ thống VNPay");
      }
    } catch (e: any) {
      message.error(e?.response?.data?.message || e?.message || "Không thể tạo giao dịch thanh toán");
    } finally {
      setPaymentLoading(false);
    }
  };

  const isPending = order.status === "PENDING";
  const displayStatus =
    order.paymentStatus === "PAID"
      ? "PAID"
      : isAwaitingPayment
      ? "AWAITING_PAYMENT"
      : ticket?.status === "APPROVED" && order.status === "PENDING"
      ? "CONFIRMED"
      : order.status;

  const paidTime =
    paymentInfo?.updatedAt || paymentInfo?.createdAt || order.paidAt || order.updatedAt;

  const getBadgeColors = () => {
    if (displayStatus === "COMPLETED" || displayStatus === "PAID") {
      return { border: "#52c41a", bg: "#f6ffed", color: "#389e0d" };
    }
    if (displayStatus === "CONFIRMED" || displayStatus === "PROCESSING") {
      return { border: "#1677ff", bg: "#e6f4ff", color: "#0958d9" };
    }
    if (displayStatus === "CANCELLED") {
      return { border: "#ff4d4f", bg: "#fff1f0", color: "#cf1322" };
    }
    return { border: "#faad14", bg: "#fffbe6", color: "#d48806" };
  };

  const badgeColors = getBadgeColors();
  const items = itemsWithImages.length > 0 ? itemsWithImages : order.items || [];

  return (
    <div className={`${styles.pageRoot} ${isDarkMode ? styles.darkMode : ""}`}>
      {/* 1. Header chuẩn thương hiệu eCommerce */}
      <Header />

      <main className={styles.main}>
        <div className={styles.container}>
          {/* Top Back & Header bar */}
          <div className={styles.topBar}>
            <button className={styles.backBtn} onClick={() => router.push("/orders/history")}>
              <ArrowLeftOutlined />
              <span>Xem tất cả đơn hàng đã mua</span>
            </button>

            <div className={styles.headerRow}>
              <h1 className={styles.orderTitle}>Đơn hàng #{order.id}</h1>

              <div className={styles.headerRight}>
                <div
                  className={styles.statusBadge}
                  style={
                    {
                      "--badge-border": badgeColors.border,
                      "--badge-bg": badgeColors.bg,
                      "--badge-color": badgeColors.color,
                    } as React.CSSProperties
                  }
                >
                  {displayStatus === "COMPLETED"
                    ? "Hoàn thành"
                    : displayStatus === "CANCELLED"
                    ? "Đã hủy"
                    : displayStatus === "PAID"
                    ? "Đã thanh toán"
                    : displayStatus === "CONFIRMED"
                    ? "Đã xác nhận"
                    : displayStatus === "PROCESSING"
                    ? "Đang xử lý / Giao"
                    : displayStatus === "AWAITING_PAYMENT"
                    ? "Chờ thanh toán"
                    : displayStatus === "REFUND_REQUESTED"
                    ? "Yêu cầu hoàn tiền"
                    : displayStatus === "REFUNDED"
                    ? "Đã hoàn tiền"
                    : "Chờ duyệt"}
                </div>

                <Button
                  className={styles.actionBackBtn}
                  onClick={() => router.push("/track-order")}
                >
                  Theo dõi lộ trình
                </Button>
              </div>
            </div>
          </div>

          <Row gutter={[28, 28]}>
            {/* CỘT TRÁI: DANH SÁCH SẢN PHẨM */}
            <Col xs={24} lg={15}>
              <div className={styles.itemsCard}>
                <h2 className={styles.cardHeading}>
                  <ShoppingOutlined style={{ marginRight: 8, color: "#1677ff" }} />
                  Sản phẩm trong đơn hàng ({items.length})
                </h2>

                <div className={styles.itemsList}>
                  {items.map((item: any, idx: number) => {
                    const price = item.unitPrice || item.price || 0;
                    const subtotal =
                      item.subTotal || item.subtotal || price * (item.quantity || 1);
                    const imgUrl = item.image || item.imageUrl || item.image_url;

                    return (
                      <div key={item.id || item.productId || idx} className={styles.itemRow}>
                        <div className={styles.itemLeft}>
                          {imgUrl ? (
                            <img
                              src={imgUrl}
                              alt={item.productName || item.name}
                              className={styles.itemImg}
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
                            <ShoppingOutlined style={{ color: "#8c8c8c", fontSize: 22 }} />
                          </div>

                          <div className={styles.itemMeta}>
                            <h3 className={styles.itemName}>
                              {item.productName || item.name || "Sản phẩm eCommerce"}
                            </h3>
                            <span className={styles.itemPriceUnit}>
                              {formatCurrency(price)} × {item.quantity || 1}
                            </span>
                          </div>
                        </div>

                        <div className={styles.itemRight}>
                          <span className={styles.itemTotal}>{formatCurrency(subtotal)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Col>

            {/* CỘT PHẢI: THÔNG TIN KHÁCH HÀNG & THANH TOÁN */}
            <Col xs={24} lg={9}>
              <div className={styles.sideWrapper}>
                {/* Thẻ khách hàng */}
                <div className={styles.infoCard}>
                  <h2 className={styles.cardHeading}>
                    <UserOutlined style={{ marginRight: 8, color: "#1677ff" }} />
                    Thông tin khách hàng
                  </h2>

                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Khách hàng</span>
                    <span className={styles.infoValue}>{order.customerName || "—"}</span>
                  </div>

                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Email</span>
                    <span className={styles.infoValue}>{order.customerEmail || "—"}</span>
                  </div>

                  {order.createdAt && (
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Ngày tạo đơn</span>
                      <span className={styles.infoValue}>
                        {formatDateTime(order.createdAt)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Thẻ thanh toán */}
                <div className={styles.infoCard}>
                  <h2 className={styles.cardHeading}>
                    <CreditCardOutlined style={{ marginRight: 8, color: "#1677ff" }} />
                    Thanh toán
                  </h2>

                  <div className={styles.paymentTotalRow}>
                    <span className={styles.totalLabel}>Tổng thanh toán</span>
                    <span className={styles.totalValue}>
                      {formatCurrency(order.totalAmount)}
                    </span>
                  </div>

                  {order.status === "CANCELLED" && (
                    <Alert
                      message="Đơn hàng đã huỷ"
                      description={order.cancelReason || "Đơn hàng đã được hệ thống hủy."}
                      type="error"
                      showIcon
                      icon={<CloseCircleFilled />}
                    />
                  )}

                  {order.status === "PENDING" && ticket?.status !== "APPROVED" && (
                    <Alert
                      message="Chờ duyệt đơn hàng"
                      description={
                        ticket?.status === "PENDING_PO_APPROVE"
                          ? "Đơn hàng đang chờ Product Owner (PO) duyệt cấp 1."
                          : ticket?.status === "PENDING_AD_APPROVE"
                          ? "Đơn hàng đã được PO duyệt, đang chờ Quản trị viên (Admin) duyệt lần cuối."
                          : "Đơn hàng của bạn đang được xét duyệt. Nút thanh toán sẽ mở ngay sau khi được duyệt hoàn tất."
                      }
                      type="info"
                      showIcon
                      icon={<ClockCircleFilled />}
                    />
                  )}

                  {(order.status === "CONFIRMED" || order.status === "AWAITING_PAYMENT" || ticket?.status === "APPROVED") && order.paymentStatus !== "PAID" && order.status !== "CANCELLED" && (
                    <div>
                      {isAwaitingPayment && (
                        <div style={{ marginBottom: 14 }}>
                          <Alert
                            message="Đang chờ xác nhận thanh toán..."
                            description="Vui lòng hoàn tất giao dịch trên cổng thanh toán."
                            type="warning"
                            showIcon
                          />
                        </div>
                      )}
                      <Button
                        type="primary"
                        block
                        size="large"
                        className={styles.payActionBtn}
                        onClick={handlePayment}
                        loading={paymentLoading}
                      >
                        {isAwaitingPayment ? "Mở lại trang thanh toán " : "Thanh toán ngay qua ngân hàng"}
                      </Button>
                    </div>
                  )}

                  {(order.paymentStatus === "PAID" || order.paymentStatus === "REFUNDED") && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      <Alert
                        message="Thanh toán thành công"
                        description={`Giao dịch đã được ghi nhận lúc: ${formatDateTime(paidTime)}`}
                        type="success"
                        showIcon
                        icon={<CheckCircleFilled />}
                      />

                      {order.status === "REFUND_REQUESTED" && (
                        <Alert
                          message="Yêu cầu hoàn tiền đang chờ shop duyệt."
                          type="warning"
                          showIcon
                        />
                      )}

                      {order.status === "REFUNDED" && (
                        <Alert
                          message="Đã hoàn tiền thành công."
                          type="success"
                          showIcon
                        />
                      )}

                      {(order.status === "PROCESSING" || order.status === "COMPLETED") && (
                        <Popconfirm
                          title="Yêu cầu hoàn tiền"
                          description="Bạn có chắc chắn muốn gửi yêu cầu hoàn tiền cho đơn hàng này?"
                          onConfirm={async () => {
                            try {
                              await apiClient.post(`/orders/${order.id}/refund-request`, {
                                reason: "Khách hàng đổi ý",
                              });
                              message.success("Đã gửi yêu cầu hoàn tiền thành công");
                              refetch();
                            } catch (e: any) {
                              message.error(e?.response?.data?.message || "Lỗi gửi yêu cầu");
                            }
                          }}
                          okText="Gửi yêu cầu"
                          cancelText="Đóng"
                        >
                          <Button danger block style={{ height: 42, borderRadius: 8 }}>
                            Yêu cầu hoàn tiền
                          </Button>
                        </Popconfirm>
                      )}
                    </div>
                  )}

                  <div className={styles.guaranteeNote}>
                    <SafetyCertificateOutlined style={{ color: "#52c41a", fontSize: 16 }} />
                    <span>Thanh toán an toàn bảo mật chuẩn VNPay</span>
                  </div>
                </div>
              </div>
            </Col>
          </Row>
        </div>
      </main>

      {/* Footer chuẩn thương hiệu eCommerce */}
      <Footer />
    </div>
  );
}