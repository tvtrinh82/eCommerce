"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Steps, Tag, Card, Row, Col, Input, Button, Divider, Alert, Spin, message } from "antd";
import {
  CheckCircleFilled,
  ClockCircleFilled,
  CarFilled,
  HomeFilled,
  ArrowLeftOutlined,
  SearchOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  CloseCircleFilled,
} from "@ant-design/icons";
import Header from "@/components/ecommerce/Header";
import Footer from "@/components/ecommerce/Footer";
import { apiClient } from "@/lib/api-client";
import { formatCurrency, formatDateTime } from "@/lib/format";
import styles from "./TrackOrder.module.scss";

export default function TrackOrderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialOrderId = searchParams?.get("id") || "";

  const [orderQuery, setOrderQuery] = useState(initialOrderId);
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchOrder = async (queryId: string) => {
    const cleanId = queryId.replace(/[^0-9]/g, "");
    if (!cleanId) {
      message.warning("Vui lòng nhập mã đơn hàng hợp lệ");
      return;
    }

    try {
      setLoading(true);
      setErrorMsg(null);
      const res: any = await apiClient.get(`/orders/${cleanId}`);
      const data = res.data?.data || res.data || res;
      if (data && data.id) {
        setOrder(data);
      } else {
        setErrorMsg(`Không tìm thấy đơn hàng #${cleanId}`);
        setOrder(null);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err?.response?.data?.message || `Không tìm thấy đơn hàng #${cleanId}`);
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialOrderId) {
      fetchOrder(initialOrderId);
    }
  }, [initialOrderId]);

  // Map Backend Order Status (PENDING -> CONFIRMED -> PROCESSING -> COMPLETED / CANCELLED)
  const getStepStatus = () => {
    if (!order) return 0;
    if (order.status === "CANCELLED") return -1;
    if (order.status === "COMPLETED") return 4;
    if (order.status === "PROCESSING" || order.paymentStatus === "PAID") return 3;
    if (order.status === "CONFIRMED") return 2;
    return 1; // PENDING
  };

  const currentStep = getStepStatus();

  const trackingSteps = [
    {
      title: "Đã tạo đơn hàng",
      description: order?.createdAt ? formatDateTime(order.createdAt) : "Ghi nhận hệ thống",
      status: currentStep >= 1 ? ("finish" as const) : ("wait" as const),
      icon: <CheckCircleFilled style={{ color: currentStep >= 1 ? "#52c41a" : "#bfbfbf" }} />,
    },
    {
      title: "Xác nhận & Duyệt kho",
      description: currentStep >= 2 ? "Kho eCommerce đã xác nhận" : "Đang chờ duyệt kho",
      status: currentStep >= 2 ? ("finish" as const) : currentStep === 1 ? ("process" as const) : ("wait" as const),
      icon: <CheckCircleFilled style={{ color: currentStep >= 2 ? "#52c41a" : "#1677ff" }} />,
    },
    {
      title: "Thanh toán & Đóng gói",
      description: order?.paymentStatus === "PAID" ? "Đã thanh toán thành công" : "Chờ thanh toán / COD",
      status: currentStep >= 3 ? ("finish" as const) : currentStep === 2 ? ("process" as const) : ("wait" as const),
      icon: <CarFilled style={{ color: currentStep >= 3 ? "#52c41a" : "#1677ff" }} />,
    },
    {
      title: "Đang giao hàng",
      description: currentStep >= 3 ? "Shipper đang giao hỏa tốc" : "Chuẩn bị xuất kho",
      status: currentStep >= 3 ? ("process" as const) : ("wait" as const),
      icon: <EnvironmentOutlined style={{ color: currentStep >= 3 ? "#1677ff" : "#bfbfbf" }} />,
    },
    {
      title: "Giao thành công",
      description: currentStep === 4 ? "Đã giao đến người nhận" : "Chờ giao",
      status: currentStep === 4 ? ("finish" as const) : ("wait" as const),
      icon: <HomeFilled style={{ color: currentStep === 4 ? "#52c41a" : "#bfbfbf" }} />,
    },
  ];

  return (
    <div className={styles.pageRoot}>
      <Header />

      <main className={styles.main}>
        <div className={styles.container}>
          {/* Top Header */}
          <div className={styles.topHeader}>
            <button className={styles.backBtn} onClick={() => router.push("/")}>
              <ArrowLeftOutlined />
              <span>Về trang chủ</span>
            </button>
            <h1 className={styles.pageTitle}>Tra Cứu Lộ Trình Đơn Hàng</h1>
            <p className={styles.pageSubtitle}>
              Cập nhật trạng thái thời gian thực và theo dõi đơn hàng từ hệ thống eCommerce.
            </p>
          </div>

          {/* Search order input bar */}
          <div className={styles.searchCard}>
            <div className={styles.searchRow}>
              <Input
                size="large"
                prefix={<SearchOutlined style={{ color: "#8c8c8c" }} />}
                placeholder="Nhập mã đơn hàng của bạn (ví dụ: 12, 15, hoặc TN-15)..."
                value={orderQuery}
                onChange={(e) => setOrderQuery(e.target.value)}
                onPressEnter={() => fetchOrder(orderQuery)}
                className={styles.trackInput}
              />
              <Button
                type="primary"
                size="large"
                loading={loading}
                onClick={() => fetchOrder(orderQuery)}
                className={styles.trackBtn}
              >
                Tra cứu ngay
              </Button>
            </div>
          </div>

          {loading && (
            <div style={{ padding: "60px 0", textAlign: "center" }}>
              <Spin size="large" tip="Đang truy vấn đơn hàng..." />
            </div>
          )}

          {errorMsg && !loading && (
            <Alert
              message="Không tìm thấy đơn hàng"
              description={errorMsg}
              type="error"
              showIcon
              style={{ marginBottom: 28, borderRadius: 12 }}
            />
          )}

          {order && !loading && (
            <Row gutter={[28, 28]}>
              <Col xs={24} lg={16}>
                <div className={styles.timelineCard}>
                  <div className={styles.statusHeader}>
                    <div>
                      <span className={styles.statusLabel}>Trạng thái đơn hàng #{order.id}:</span>
                      <h3 className={styles.statusMain}>
                        {order.status === "COMPLETED"
                          ? "Đơn hàng đã hoàn thành"
                          : order.status === "CANCELLED"
                          ? "Đơn hàng đã bị hủy"
                          : order.status === "PROCESSING" || order.paymentStatus === "PAID"
                          ? "Đã xác nhận & Đang giao hàng"
                          : "Đang chờ xử lý & Duyệt đơn"}
                      </h3>
                    </div>
                    <Tag
                      color={
                        order.status === "COMPLETED" || order.paymentStatus === "PAID"
                          ? "success"
                          : order.status === "CANCELLED"
                          ? "error"
                          : "processing"
                      }
                      className={styles.liveTag}
                    >
                      ●{" "}
                      {order.status === "COMPLETED"
                        ? "Hoàn thành"
                        : order.status === "CANCELLED"
                        ? "Đã hủy"
                        : order.status === "PAID"
                        ? "Đã thanh toán"
                        : order.status === "CONFIRMED"
                        ? "Đã xác nhận"
                        : order.status === "PROCESSING"
                        ? "Đang xử lý / Giao"
                        : order.status === "AWAITING_PAYMENT"
                        ? "Chờ thanh toán"
                        : order.status === "REFUND_REQUESTED"
                        ? "Yêu cầu hoàn tiền"
                        : order.status === "REFUNDED"
                        ? "Đã hoàn tiền"
                        : "Chờ duyệt"}
                    </Tag>
                  </div>

                  <div className={styles.estimatedBanner}>
                    <ClockCircleFilled style={{ color: "#1677ff", fontSize: 20 }} />
                    <div>
                      <span className={styles.estTitle}>Tổng tiền thanh toán:</span>
                      <strong className={styles.estDate}>
                        {Number(order.totalAmount || 0).toLocaleString("vi-VN")} đ • (
                        {order.paymentStatus === "PAID" || order.paymentStatus === "SUCCESS"
                          ? "Đã thanh toán"
                          : order.paymentStatus === "FAILED"
                          ? "Thanh toán thất bại"
                          : order.paymentStatus === "CANCELLED"
                          ? "Đã hủy"
                          : "Chưa thanh toán"}
                        )
                      </strong>
                    </div>
                  </div>

                  {/* Vertical Ant Design Steps */}
                  <div className={styles.stepsWrap}>
                    <Steps
                      direction="vertical"
                      current={currentStep > 0 ? currentStep : 0}
                      items={trackingSteps}
                      className={styles.verticalSteps}
                    />
                  </div>

                  {/* Chi tiết đơn hàng */}
                  <div style={{ marginTop: 20, textAlign: "right" }}>
                    <Button
                      type="link"
                      onClick={() => router.push(`/orders/${order.id}`)}
                    >
                      Xem trang chi tiết & thanh toán đơn #{order.id} →
                    </Button>
                  </div>
                </div>
              </Col>

              <Col xs={24} lg={8}>
                <div className={styles.infoCard}>
                  <h4 className={styles.infoTitle}>Thông Tin Người Nhận</h4>
                  <div className={styles.courierRow}>
                    <div className={styles.courierAvatar}>TN</div>
                    <div>
                      <strong className={styles.courierName}>
                        {order.customerName || order.customer?.name || "Khách hàng"}
                      </strong>
                      <span className={styles.courierSub}>
                        {order.customerEmail || order.customer?.email || "Chưa có email"}
                      </span>
                    </div>
                  </div>

                  <Divider style={{ margin: "16px 0" }} />

                  <div className={styles.specItem}>
                    <span className={styles.specLabel}>Mã đơn hàng</span>
                    <span className={styles.specVal}>#{order.id}</span>
                  </div>
                  <div className={styles.specItem}>
                    <span className={styles.specLabel}>Ngày đặt</span>
                    <span className={styles.specVal}>
                      {order.createdAt ? formatDateTime(order.createdAt) : "—"}
                    </span>
                  </div>
                  <div className={styles.specItem}>
                    <span className={styles.specLabel}>Số lượng sản phẩm</span>
                    <span className={styles.specVal}>
                      {order.orderItems?.length || 1} dòng sản phẩm
                    </span>
                  </div>

                  <Divider style={{ margin: "16px 0" }} />

                  <Button
                    block
                    type="primary"
                    size="large"
                    onClick={() => router.push(`/orders/${order.id}`)}
                    className={styles.contactBtn}
                  >
                    Mở hóa đơn #{order.id}
                  </Button>
                </div>
              </Col>
            </Row>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
