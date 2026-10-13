"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { message as antdMessage, Button, Spin, Select } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import ClientLayout from "@/components/shared/ClientLayout";
import { apiClient } from "@/lib/api-client";

function CollapsibleProductName({ name }: { name: string }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = (name || "").length > 60;

  if (!isLong) {
    return <span style={{ lineHeight: 1.4 }}>{name}</span>;
  }

  return (
    <div style={{ lineHeight: 1.4 }}>
      <span>{expanded ? name : `${name.slice(0, 55)}...`}</span>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setExpanded(!expanded);
        }}
        style={{
          background: "none",
          border: "none",
          color: "#2563eb",
          cursor: "pointer",
          padding: 0,
          fontSize: 12.5,
          fontWeight: 600,
          marginLeft: 6,
          display: "inline-block",
        }}
      >
        {expanded ? "Thu gọn" : "Xem thêm"}
      </button>
    </div>
  );
}

export default function ShopOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params?.id as string;
  const [messageApi, contextHolder] = antdMessage.useMessage();

  const [order, setOrder] = useState<any>(null);
  const [ticket, setTicket] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Add product form state
  const [selectedProductId, setSelectedProductId] = useState<number | string>("");
  const [inputQuantity, setInputQuantity] = useState<number>(1);
  const [errorMessage, setErrorMessage] = useState<string>("");

  // Payment state (B4)
  const [isPaymentInitiated, setIsPaymentInitiated] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string>("");
  const [countdownSeconds, setCountdownSeconds] = useState<number>(15 * 60);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Fetch order details & associated ticket from BE
  const fetchOrderAndTicket = useCallback(async () => {
    if (!orderId) return;
    try {
      const res: any = await apiClient.get(`/orders/${orderId}`);
      const orderData = res?.data || res;
      setOrder(orderData);

      // Fetch ticket for the order to check approval status
      try {
        const ticketRes: any = await apiClient.get(`/tickets/order/${orderId}`);
        const tData = ticketRes?.data || ticketRes;
        setTicket(tData);
      } catch (tErr) {
        setTicket(null);
      }

      return orderData;
    } catch (err: any) {
      console.error("Lỗi tải chi tiết đơn hàng:", err);
      messageApi.error(err?.message || "Không thể tải thông tin đơn hàng");
    }
  }, [orderId, messageApi]);

  // 2. Fetch products for dropdown
  const fetchProducts = useCallback(async () => {
    try {
      const res: any = await apiClient.get("/products?page=0&size=1000");
      const list = res?.data?.content || res?.content || res?.data || [];
      setProducts(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("Lỗi tải danh sách sản phẩm:", err);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchOrderAndTicket(), fetchProducts()]);
      setLoading(false);
    };
    init();
  }, [fetchOrderAndTicket, fetchProducts]);

  // Check localStorage for active payment session (Idempotence & F5 preservation)
  useEffect(() => {
    if (!orderId) return;
    const sessionKey = `payment_session_${orderId}`;
    const savedSession = localStorage.getItem(sessionKey);
    if (savedSession) {
      try {
        const parsed = JSON.parse(savedSession);
        const remainingMs = parsed.expiresAt - Date.now();
        if (remainingMs > 0) {
          setIsPaymentInitiated(true);
          setPaymentUrl(parsed.paymentUrl);
          setCountdownSeconds(Math.floor(remainingMs / 1000));
        } else {
          localStorage.removeItem(sessionKey);
        }
      } catch (e) {
        localStorage.removeItem(sessionKey);
      }
    }
  }, [orderId]);

  // Countdown timer effect
  useEffect(() => {
    if (isPaymentInitiated && countdownSeconds > 0) {
      timerRef.current = setInterval(() => {
        setCountdownSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current as NodeJS.Timeout);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaymentInitiated, countdownSeconds]);

  const formatCountdown = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const isPending = order?.status === "PENDING";
  const isAwaitingPayment = order?.status === "AWAITING_PAYMENT" || isPaymentInitiated;
  const isTicketApproved = !ticket || ticket.status === "APPROVED";

  // Handler: Add product to PENDING order
  const handleAddProduct = async () => {
    setErrorMessage("");
    if (!selectedProductId) {
      messageApi.warning("Vui lòng chọn sản phẩm cần thêm");
      return;
    }

    const product = products.find((p) => String(p.id) === String(selectedProductId));
    if (!product) return;

    // FE Validation: Check Inactive
    if (product.status === "DEACTIVE" || product.status === "INACTIVE") {
      setErrorMessage(`Sản phẩm ${product.name} đã ngừng bán`);
      return;
    }

    // FE Validation: Check Out of stock
    if (product.stock <= 0) {
      setErrorMessage(`Sản phẩm ${product.name} đã hết hàng`);
      return;
    }

    // FE Validation: Check quantity bounds
    if (inputQuantity < 1 || inputQuantity > 99) {
      setErrorMessage("Số lượng phải từ 1 đến 99");
      return;
    }

    // FE Validation: Check aggregate > 99
    const existingItem = (order.items || []).find(
      (item: any) => String(item.productId) === String(selectedProductId)
    );
    const currentQty = existingItem ? existingItem.quantity : 0;
    const newTotalQty = currentQty + inputQuantity;

    if (newTotalQty > 99) {
      setErrorMessage(`vượt 99 (${currentQty} + ${inputQuantity} = ${newTotalQty})`);
      return;
    }

    // FE Validation: Check stock limit
    if (inputQuantity > product.stock) {
      setErrorMessage(`Không đủ hàng: ${product.name} chỉ còn ${product.stock}, yêu cầu ${inputQuantity}`);
      return;
    }

    try {
      setActionLoading(true);
      const res: any = await apiClient.post(`/orders/${orderId}/items`, {
        productId: Number(selectedProductId),
        quantity: inputQuantity,
      });

      const updatedOrder = res?.data || res;
      setOrder(updatedOrder);
      messageApi.success("Thêm sản phẩm thành công");
      setSelectedProductId("");
      setInputQuantity(1);
      setErrorMessage("");
      fetchOrderAndTicket();
      fetchProducts();
    } catch (err: any) {
      const msg = err?.message || err?.response?.data?.message || "Có lỗi xảy ra khi thêm sản phẩm";
      setErrorMessage(msg);
    } finally {
      setActionLoading(false);
    }
  };

  // Handler: Change item quantity (Stepper - / +)
  const handleUpdateQuantity = async (productId: number, targetQty: number) => {
    setErrorMessage("");

    if (targetQty < 1) return;

    if (targetQty > 99) {
      setErrorMessage("Số lượng sản phẩm không được vượt quá 99");
      return;
    }

    const currentItem = (order.items || []).find((i: any) => i.productId === productId);
    const product = products.find((p) => p.id === productId);

    if (currentItem && product && targetQty > currentItem.quantity) {
      const diff = targetQty - currentItem.quantity;
      if (diff > product.stock) {
        setErrorMessage(`Không đủ hàng: ${product.name} chỉ còn ${product.stock}, yêu cầu ${diff}`);
        return;
      }
    }

    try {
      setActionLoading(true);
      const res: any = await apiClient.patch(`/orders/${orderId}/items/${productId}`, {
        quantity: targetQty,
      });

      const updatedOrder = res?.data || res;
      setOrder(updatedOrder);
      setErrorMessage("");
      fetchOrderAndTicket();
      fetchProducts();
    } catch (err: any) {
      const msg = err?.message || err?.response?.data?.message || "Có lỗi xảy ra khi cập nhật số lượng";
      setErrorMessage(msg);
    } finally {
      setActionLoading(false);
    }
  };

  // Handler: Delete item from order (✕)
  const handleDeleteItem = async (productId: number) => {
    setErrorMessage("");
    try {
      setActionLoading(true);
      const res: any = await apiClient.delete(`/orders/${orderId}/items/${productId}`);
      const updatedOrder = res?.data || res;
      setOrder(updatedOrder);
      messageApi.success("Đã xoá sản phẩm khỏi đơn hàng");
      setErrorMessage("");
      fetchOrderAndTicket();
      fetchProducts();
    } catch (err: any) {
      const msg = err?.message || err?.response?.data?.message || "Có lỗi xảy ra khi xoá sản phẩm";
      setErrorMessage(msg);
    } finally {
      setActionLoading(false);
    }
  };

  // Handler: Payment Checkout (B4)
  const handleCheckout = async () => {
    if (isPaymentInitiated) {
      messageApi.info("Giao dịch thanh toán đã được tạo, vui lòng mở trang thanh toán.");
      return;
    }

    // Chặn ở FE nếu vé chưa được duyệt:
    if (!isTicketApproved) {
      messageApi.warning(
        `Đơn hàng chưa được phê duyệt vé mua hàng (Trạng thái vé: ${ticket?.status}). Vui lòng chờ Người kiểm duyệt duyệt đơn trước khi thanh toán!`
      );
      return;
    }

    try {
      setActionLoading(true);
      const idempotencyKey = `checkout-order-${orderId}-${Date.now()}`;

      let checkoutRes: any = null;
      try {
        checkoutRes = await apiClient.post(
          `/orders/${orderId}/checkout`,
          {},
          { headers: { "Idempotency-Key": idempotencyKey } }
        );
      } catch (checkoutErr: any) {
        checkoutRes = await apiClient.post(`/payments/vnpay/create`, {
          orderId: Number(orderId),
          locale: "vn",
        });
      }

      const checkoutData = checkoutRes?.data || checkoutRes;
      const url = checkoutData?.paymentUrl || checkoutData?.data?.paymentUrl;

      if (url) {
        setPaymentUrl(url);
        setIsPaymentInitiated(true);
        setCountdownSeconds(15 * 60);

        const sessionData = {
          orderId,
          paymentUrl: url,
          expiresAt: Date.now() + 15 * 60 * 1000,
          initiatedAt: Date.now(),
        };
        localStorage.setItem(`payment_session_${orderId}`, JSON.stringify(sessionData));

        setOrder((prev: any) => ({
          ...prev,
          status: "AWAITING_PAYMENT",
        }));

        messageApi.success("Đã tạo giao dịch thanh toán thành công!");
      } else {
        messageApi.error("Không nhận được liên kết thanh toán từ hệ thống");
      }
    } catch (err: any) {
      const msg = err?.message || err?.response?.data?.message || "Thao tác thanh toán thất bại";
      setErrorMessage(msg);
      messageApi.error(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenPaymentPage = () => {
    if (paymentUrl) {
      window.open(paymentUrl, "_blank");
    }
  };

  if (loading || !order) {
    return (
      <ClientLayout>
        <div style={{ textAlign: "center", padding: "80px 0" }}>
          <Spin size="large" />
        </div>
      </ClientLayout>
    );
  }

  const getVietnameseStatus = (status: string) => {
    switch (status) {
      case "PENDING":
        return "Chờ xác nhận";
      case "AWAITING_PAYMENT":
        return "Chờ thanh toán";
      case "CONFIRMED":
        return "Đã duyệt";
      case "PROCESSING":
        return "Đang xử lý";
      case "COMPLETED":
        return "Hoàn thành";
      case "PAID":
        return "Đã thanh toán";
      case "CANCELLED":
        return "Đã hủy";
      case "REFUND_REQUESTED":
        return "Yêu cầu hoàn tiền";
      case "REFUNDED":
        return "Đã hoàn tiền";
      default:
        return status;
    }
  };

  const getTicketStatusText = (status: string) => {
    switch (status) {
      case "PENDING_PO_APPROVE":
      case "PENDING":
        return "Chờ duyệt";
      case "APPROVED":
        return "Đã duyệt";
      case "REJECTED":
        return "Từ chối";
      default:
        return status || "Chờ duyệt";
    }
  };

  const badgeBg =
    order.status === "PENDING"
      ? "#fffbe6"
      : order.status === "AWAITING_PAYMENT"
      ? "#fffbe6"
      : order.status === "CONFIRMED"
      ? "#eff6ff"
      : order.status === "PROCESSING"
      ? "#f0fdf4"
      : order.status === "COMPLETED" || order.status === "PAID"
      ? "#f6ffed"
      : "#fff1f0";

  const badgeBorder =
    order.status === "PENDING"
      ? "#f59e0b"
      : order.status === "AWAITING_PAYMENT"
      ? "#f59e0b"
      : order.status === "CONFIRMED"
      ? "#3b82f6"
      : order.status === "PROCESSING"
      ? "#22c55e"
      : order.status === "COMPLETED" || order.status === "PAID"
      ? "#52c41a"
      : "#ff4d4f";

  const badgeColor =
    order.status === "PENDING"
      ? "#b45309"
      : order.status === "AWAITING_PAYMENT"
      ? "#b45309"
      : order.status === "CONFIRMED"
      ? "#1d4ed8"
      : order.status === "PROCESSING"
      ? "#15803d"
      : order.status === "COMPLETED" || order.status === "PAID"
      ? "#389e0d"
      : "#cf1322";

  return (
    <ClientLayout>
      {contextHolder}
      <div className="order-page-container">
        <div className="order-page-card">
          {/* Header: Đơn hàng #ID + Badge trạng thái */}
          <div className="order-header-row">
            <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#111" }}>
                Đơn hàng #{order.id}
              </h1>
              <span
                style={{
                  padding: "4px 14px",
                  borderRadius: 999,
                  border: `1.5px solid ${badgeBorder}`,
                  backgroundColor: badgeBg,
                  color: badgeColor,
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                {getVietnameseStatus(order.status)}
              </span>
            </div>

            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => router.back()}
              style={{ borderRadius: 6, height: 36 }}
            >
              Thoát
            </Button>
          </div>

          {/* Khách hàng */}
          <div style={{ fontSize: 14, color: "#374151", marginBottom: 20 }}>
            Khách hàng: <strong>{order.customerName || order.customer?.name || "Nguyễn Văn An"}</strong>
          </div>

          {/* Main Grid: Left Table & Actions | Right Payment Card */}
          <div className="order-main-layout">
            {/* Cột trái: Bảng sản phẩm & Bộ thêm sản phẩm */}
            <div className="left-panel">
              <div className="order-table-container">
                <table className="order-table order-table-responsive">
                  <thead>
                    <tr style={{ backgroundColor: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                      <th style={{ padding: "10px 14px", textAlign: "left", fontSize: 14, fontWeight: 600, width: "42%", maxWidth: 360 }}>Sản phẩm</th>
                      <th style={{ padding: "10px 14px", textAlign: "right", fontSize: 14, fontWeight: 600, width: 130 }}>Đơn giá</th>
                      <th style={{ padding: "10px 14px", textAlign: "center", fontSize: 14, fontWeight: 600, width: 120 }}>Số lượng</th>
                      <th style={{ padding: "10px 14px", textAlign: "right", fontSize: 14, fontWeight: 600, width: 130 }}>Thành tiền</th>
                      {isPending && (
                        <th style={{ padding: "10px 14px", textAlign: "center", fontSize: 14, fontWeight: 600, width: 60 }}>Xoá</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {(order.items || []).length > 0 ? (
                      (order.items || []).map((item: any) => {
                        const unitPrice = item.unitPrice ?? item.price ?? 0;
                        const subTotal = item.subTotal ?? item.subtotal ?? unitPrice * item.quantity;
                        return (
                          <tr key={item.productId} style={{ borderBottom: "1px solid #f3f4f6" }}>
                            <td style={{ padding: "12px 14px", fontSize: 14, fontWeight: 500, color: "#111", maxWidth: 360 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                <img
                                  src={
                                    item.imageUrl ||
                                    products.find((p) => String(p.id) === String(item.productId))?.imageUrl ||
                                    "/icon.png"
                                  }
                                  alt={item.productName || item.name}
                                  style={{
                                    width: 44,
                                    height: 44,
                                    borderRadius: 6,
                                    objectFit: "contain",
                                    border: "1px solid #f3f4f6",
                                    backgroundColor: "#f9fafb",
                                    flexShrink: 0,
                                  }}
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = "/icon.png";
                                  }}
                                />
                                <CollapsibleProductName name={item.productName || item.name || ""} />
                              </div>
                            </td>
                            <td style={{ padding: "12px 14px", textAlign: "right", fontSize: 14, color: "#374151" }}>
                              {unitPrice.toLocaleString("vi-VN")}
                            </td>
                            <td style={{ padding: "12px 14px", textAlign: "center" }}>
                              {isPending ? (
                                <div
                                  className="stepper-wrap"
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    border: "1px solid #d1d5db",
                                    borderRadius: 6,
                                    overflow: "hidden",
                                    backgroundColor: "#fff",
                                  }}
                                >
                                  <button
                                    type="button"
                                    className="stepper-btn"
                                    disabled={actionLoading || item.quantity <= 1}
                                    onClick={() => handleUpdateQuantity(item.productId, item.quantity - 1)}
                                    style={{
                                      width: 28,
                                      height: 28,
                                      border: "none",
                                      background: "#f9fafb",
                                      cursor: item.quantity <= 1 ? "not-allowed" : "pointer",
                                      fontWeight: 700,
                                      color: "#374151",
                                      fontSize: 14,
                                    }}
                                  >
                                    -
                                  </button>
                                  <span
                                    className="stepper-qty"
                                    style={{
                                      minWidth: 32,
                                      textAlign: "center",
                                      fontSize: 14,
                                      fontWeight: 600,
                                      color: "#111",
                                    }}
                                  >
                                    {item.quantity}
                                  </span>
                                  <button
                                    type="button"
                                    className="stepper-btn"
                                    disabled={actionLoading || item.quantity >= 99}
                                    onClick={() => handleUpdateQuantity(item.productId, item.quantity + 1)}
                                    style={{
                                      width: 28,
                                      height: 28,
                                      border: "none",
                                      background: "#f9fafb",
                                      cursor: item.quantity >= 99 ? "not-allowed" : "pointer",
                                      fontWeight: 700,
                                      color: "#374151",
                                      fontSize: 14,
                                    }}
                                  >
                                    +
                                  </button>
                                </div>
                              ) : (
                                <span style={{ fontSize: 14, fontWeight: 600 }}>{item.quantity}</span>
                              )}
                            </td>
                            <td style={{ padding: "12px 14px", textAlign: "right", fontSize: 14, fontWeight: 500, color: "#111" }}>
                              {subTotal.toLocaleString("vi-VN")}
                            </td>
                            {isPending && (
                              <td style={{ padding: "12px 14px", textAlign: "center" }}>
                                <button
                                  type="button"
                                  className="btn-delete-row"
                                  disabled={actionLoading}
                                  onClick={() => handleDeleteItem(item.productId)}
                                  style={{
                                    border: "none",
                                    background: "none",
                                    color: "#2563eb",
                                    fontSize: 16,
                                    cursor: "pointer",
                                    fontWeight: 700,
                                  }}
                                >
                                  ✕
                                </button>
                              </td>
                            )}
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={isPending ? 5 : 4} style={{ textAlign: "center", padding: "24px", color: "#888" }}>
                          Đơn hàng chưa có sản phẩm nào
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Hàng thêm sản phẩm (Chỉ khi đơn PENDING) */}
              {isPending && (
                <div className="order-add-product-row">
                  <div style={{ flex: 1, minWidth: 220 }}>
                    <Select
                      value={selectedProductId || undefined}
                      placeholder="Thêm sản phẩm"
                      onChange={(val) => {
                        setSelectedProductId(val);
                        setErrorMessage("");
                      }}
                      style={{ width: "100%", height: 38 }}
                      popupMatchSelectWidth={true}
                      options={products.map((p: any) => {
                        const isOutOfStock = p.stock === 0;
                        const isInactive = p.status === "DEACTIVE" || p.status === "INACTIVE";
                        const statusNote = isInactive
                          ? " (Ngừng bán)"
                          : isOutOfStock
                          ? " (Hết hàng)"
                          : ` (Còn ${p.stock})`;
                        return {
                          value: p.id,
                          disabled: isOutOfStock || isInactive,
                          label: (
                            <div
                              style={{
                                whiteSpace: "normal",
                                wordBreak: "break-word",
                                lineHeight: 1.4,
                                padding: "4px 0",
                                color: isOutOfStock || isInactive ? "#9ca3af" : "#111827",
                              }}
                            >
                              <span>{p.name}</span>
                              <span
                                style={{
                                  fontSize: 12.5,
                                  color: isOutOfStock || isInactive ? "#ef4444" : "#2563eb",
                                  fontWeight: 500,
                                  marginLeft: 6,
                                }}
                              >
                                {statusNote}
                              </span>
                            </div>
                          ),
                        };
                      })}
                    />
                  </div>

                  <div>
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        border: "1px solid #d1d5db",
                        borderRadius: 6,
                        overflow: "hidden",
                        backgroundColor: "#fff",
                        height: 38,
                      }}
                    >
                      <button
                        type="button"
                        disabled={actionLoading || inputQuantity <= 1}
                        onClick={() => {
                          setInputQuantity((prev) => Math.max(1, prev - 1));
                          setErrorMessage("");
                        }}
                        style={{
                          width: 32,
                          height: 38,
                          border: "none",
                          background: "#f9fafb",
                          cursor: inputQuantity <= 1 ? "not-allowed" : "pointer",
                          fontWeight: 700,
                          fontSize: 16,
                          color: inputQuantity <= 1 ? "#9ca3af" : "#374151",
                        }}
                      >
                        -
                      </button>
                      <span
                        style={{
                          width: 38,
                          textAlign: "center",
                          fontSize: 14,
                          fontWeight: 600,
                          color: "#111",
                        }}
                      >
                        {inputQuantity}
                      </span>
                      <button
                        type="button"
                        disabled={actionLoading || inputQuantity >= 99}
                        onClick={() => {
                          setInputQuantity((prev) => Math.min(99, prev + 1));
                          setErrorMessage("");
                        }}
                        style={{
                          width: 32,
                          height: 38,
                          border: "none",
                          background: "#f9fafb",
                          cursor: inputQuantity >= 99 ? "not-allowed" : "pointer",
                          fontWeight: 700,
                          fontSize: 16,
                          color: inputQuantity >= 99 ? "#9ca3af" : "#374151",
                        }}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="btn-add-row"
                    disabled={actionLoading}
                    onClick={handleAddProduct}
                    style={{
                      height: 38,
                      padding: "0 22px",
                      backgroundColor: "#e6f0fa",
                      border: "1.5px solid #2563eb",
                      borderRadius: 6,
                      color: "#1d4ed8",
                      fontWeight: 600,
                      fontSize: 14,
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Thêm
                  </button>
                </div>
              )}

              {/* Hộp lỗi màu đỏ */}
              {errorMessage && (
                <div
                  className="order-error-box"
                  style={{
                    marginTop: 14,
                    backgroundColor: "#fef2f2",
                    border: "1px solid #f87171",
                    borderRadius: 6,
                    padding: "10px 14px",
                    color: "#dc2626",
                    fontSize: 14,
                    fontWeight: 500,
                  }}
                >
                  {errorMessage}
                </div>
              )}

              {/* Tổng tiền theo BE */}
              <div
                style={{
                  marginTop: 20,
                  fontSize: 16,
                  fontWeight: 700,
                  color: "#111",
                  textAlign: "right",
                }}
              >
                Tổng tiền: {(order.totalAmount || 0).toLocaleString("vi-VN")} đ
              </div>
            </div>

            {/* Cột phải: Thanh toán (B4) */}
            <div className="right-panel">
              <div
                className="payment-card"
                style={{
                  border: "1px solid #d1d5db",
                  borderRadius: 8,
                  padding: "20px",
                  backgroundColor: "#fff",
                }}
              >
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 10px 0", color: "#111" }}>
                  Thanh toán
                </h3>

                <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 4 }}>
                  Số tiền
                </div>

                <div
                  style={{
                    fontSize: 20,
                    fontWeight: 800,
                    color: "#111",
                    marginBottom: 16,
                  }}
                >
                  {(order.totalAmount || 0).toLocaleString("vi-VN")} đ
                </div>

                {/* TH1: Đơn PENDING */}
                {isPending && !isPaymentInitiated && (
                  <div>
                    {/* Nếu vé chưa được duyệt: Hiện thông báo và vô hiệu nút thanh toán */}
                    {!isTicketApproved ? (
                      <div
                        style={{
                          backgroundColor: "#fffbe6",
                          border: "1px solid #ffe58f",
                          borderRadius: 6,
                          padding: "10px 12px",
                          color: "#d48806",
                          fontSize: 13,
                          lineHeight: 1.5,
                          marginBottom: 12,
                        }}
                      >
                        ⏳ <strong>Chờ duyệt đơn:</strong> Đơn hàng đang chờ Người kiểm duyệt phê duyệt (Trạng thái vé: <strong>{getTicketStatusText(ticket?.status)}</strong>). Bạn chưa thể thanh toán lúc này.
                      </div>
                    ) : (
                      <div
                        style={{
                          backgroundColor: "#f6ffed",
                          border: "1px solid #b7eb8f",
                          borderRadius: 6,
                          padding: "8px 12px",
                          color: "#389e0d",
                          fontSize: 12.5,
                          marginBottom: 12,
                        }}
                      >
                        ✓ Đơn hàng đã được phê duyệt, sẵn sàng thanh toán.
                      </div>
                    )}

                    <button
                      type="button"
                      className="btn-pay"
                      disabled={actionLoading || (order.items || []).length === 0 || !isTicketApproved}
                      onClick={handleCheckout}
                      style={{
                        width: "100%",
                        height: 40,
                        backgroundColor: !isTicketApproved ? "#f3f4f6" : "#dbeafe",
                        border: `1.5px solid ${!isTicketApproved ? "#d1d5db" : "#2563eb"}`,
                        borderRadius: 6,
                        color: !isTicketApproved ? "#9ca3af" : "#1d4ed8",
                        fontWeight: 600,
                        fontSize: 14,
                        cursor: !isTicketApproved ? "not-allowed" : "pointer",
                        transition: "all 0.2s",
                      }}
                    >
                      {!isTicketApproved ? "Chờ duyệt đơn để thanh toán" : "Thanh toán"}
                    </button>
                  </div>
                )}

                {/* TH2: Trạng thái sau khi bấm thanh toán (AWAITING_PAYMENT / B4) */}
                {isPaymentInitiated && (
                  <div
                    className="payment-countdown-info"
                    style={{
                      borderTop: "1px solid #e5e7eb",
                      paddingTop: 12,
                      fontSize: 13,
                      color: "#374151",
                      lineHeight: 1.8,
                    }}
                  >
                    <div style={{ fontWeight: 600, color: "#111", marginBottom: 6 }}>
                      Sau khi bấm:
                    </div>
                    <div>• Trạng thái: <strong>chờ thanh toán</strong></div>
                    <div>• Còn lại: <strong>{formatCountdown(countdownSeconds)}</strong> (đếm ngược)</div>
                    {paymentUrl && (
                      <button
                        type="button"
                        className="btn-open-payment"
                        onClick={handleOpenPaymentPage}
                        style={{
                          width: "100%",
                          height: 38,
                          marginTop: 10,
                          backgroundColor: "#2563eb",
                          color: "#fff",
                          border: "none",
                          borderRadius: 6,
                          fontWeight: 600,
                          fontSize: 13.5,
                          cursor: "pointer",
                        }}
                      >
                        Mở trang thanh toán
                      </button>
                    )}
                    <div style={{ marginTop: 8, color: "#6b7280", fontSize: 12.5 }}>
                      • Bấm lại không tạo trùng
                    </div>
                  </div>
                )}

                {/* TH3: Đơn khác PENDING và không phải đang chờ thanh toán */}
                {!isPending && !isAwaitingPayment && (
                  <div
                    style={{
                      padding: "10px 12px",
                      backgroundColor: "#f9fafb",
                      borderRadius: 6,
                      border: "1px solid #e5e7eb",
                      fontSize: 13,
                      color: "#4b5563",
                    }}
                  >
                    {order.status === "COMPLETED" || order.status === "PAID"
                      ? "Đơn hàng đã được thanh toán thành công."
                      : order.status === "CANCELLED"
                      ? "Đơn hàng đã bị huỷ."
                      : `Trạng thái đơn: ${getVietnameseStatus(order.status)}`}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </ClientLayout>
  );
}