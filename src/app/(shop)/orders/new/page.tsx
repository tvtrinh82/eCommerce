"use client";

import React, { useState, useMemo, useEffect } from "react";
import { message as antdMessage, Button, Select } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import ClientLayout from "@/components/shared/ClientLayout";
import { apiClient } from "@/lib/api-client";
import { useCurrentUser } from "@/features/auth/hooks";
import { useQueryClient } from "@tanstack/react-query";
import { cartApi } from "@/features/cart/api";
import { CART_QUERY_KEY } from "@/features/cart/hooks";

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

export default function ShopCreateOrderPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [messageApi, contextHolder] = antdMessage.useMessage();

  const { data: user } = useCurrentUser();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [selectedProductId, setSelectedProductId] = useState<number | string>("");
  const [selectedQuantity, setSelectedQuantity] = useState<number>(1);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const [cartItems, setCartItems] = useState<any[]>([]);

  // Đọc danh sách sản phẩm được chọn từ giỏ hàng nếu chuyển từ trang /cart sang
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("order_checkout_items");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCartItems(parsed);
          sessionStorage.removeItem("order_checkout_items");
        }
      }
    } catch (e) {
      console.error("Lỗi đọc order_checkout_items:", e);
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const prodRes: any = await apiClient
          .get("/products?page=0&size=1000")
          .catch(() => ({ data: [] }));

        const prodList =
          prodRes?.data?.content || prodRes?.content || prodRes?.data || [];

        setProducts(Array.isArray(prodList) ? prodList : []);
      } catch (err) {
        console.error("Lỗi tải danh sách sản phẩm:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleAddProduct = () => {
    setErrorMessage("");

    if (!selectedProductId) {
      messageApi.warning("Vui lòng chọn sản phẩm");
      return;
    }
    const product = products.find((p: any) => String(p.id) === String(selectedProductId));
    if (!product) return;

    // Chặn ở FE: Kiểm tra ngừng bán
    const isInactive = product.status === "DEACTIVE" || product.status === "INACTIVE";
    if (isInactive) {
      const err = `Sản phẩm "${product.name}" đã ngừng bán`;
      setErrorMessage(err);
      messageApi.error(err);
      return;
    }

    // Chặn ở FE: Kiểm tra hết hàng
    if (product.stock <= 0) {
      const err = `Sản phẩm "${product.name}" đã hết hàng`;
      setErrorMessage(err);
      messageApi.error(err);
      return;
    }

    // Chặn ở FE: Số lượng từ 1 đến 99
    if (selectedQuantity < 1 || selectedQuantity > 99) {
      const err = "Số lượng phải từ 1 đến 99";
      setErrorMessage(err);
      messageApi.warning(err);
      return;
    }

    const existing = cartItems.find((item) => String(item.productId) === String(selectedProductId));
    const currentQty = existing ? existing.quantity : 0;
    const newQty = currentQty + selectedQuantity;

    // Chặn ở FE: Số lượng vượt 99
    if (newQty > 99) {
      const err = `vượt 99 (${currentQty} + ${selectedQuantity} = ${newQty})`;
      setErrorMessage(err);
      messageApi.warning(err);
      return;
    }

    if (existing) {
      setCartItems((prev) =>
        prev.map((item) =>
          String(item.productId) === String(selectedProductId)
            ? { ...item, quantity: newQty }
            : item
        )
      );
    } else {
      setCartItems((prev) => [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          price: product.price,
          stock: product.stock,
          quantity: selectedQuantity,
          imageUrl: product.imageUrl,
        },
      ]);
    }

    setSelectedProductId("");
    setSelectedQuantity(1);
    setErrorMessage("");
  };

  const handleRemoveItem = (productId: number) => {
    setCartItems((prev) => prev.filter((item) => item.productId !== productId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    const targetCustomerId = user?.customerId;
    if (!targetCustomerId) {
      messageApi.error("Không tìm thấy thông tin khách hàng đăng nhập");
      return;
    }

    if (cartItems.length === 0) {
      messageApi.error("Đơn hàng phải có ít nhất 1 sản phẩm");
      return;
    }

    // Chặn ở FE: Không đủ hàng khi tạo đơn -> báo rõ sản phẩm nào, còn bao nhiêu; đơn không được tạo
    for (const item of cartItems) {
      if (item.stock !== undefined && item.quantity > item.stock) {
        const err = `Không đủ hàng: ${item.name} chỉ còn ${item.stock}, yêu cầu ${item.quantity}`;
        setErrorMessage(err);
        messageApi.error(err);
        return;
      }
    }

    const payload = {
      customerId: Number(targetCustomerId),
      items: cartItems.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
    };

    try {
      setSubmitting(true);
      const res: any = await apiClient.post("/orders", payload);
      messageApi.success("Tạo đơn hàng thành công!");

      // Xoá các sản phẩm đã đặt khỏi giỏ hàng
      for (const item of cartItems) {
        try {
          await cartApi.removeItem(item.productId);
        } catch {}
      }
      queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY });

      const createdOrder = Array.isArray(res?.data) ? res.data[0] : res?.data;
      const orderId = createdOrder?.id || res?.data?.id || res?.id;

      setTimeout(() => {
        if (orderId) {
          router.push(`/orders/${orderId}`);
        } else {
          router.push("/orders");
        }
      }, 500);
    } catch (err: any) {
      const msg = err?.message || err?.response?.data?.message || "Có lỗi xảy ra khi tạo đơn hàng";
      setErrorMessage(msg);
      messageApi.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const totalAmount = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0);
  }, [cartItems]);

  return (
    <ClientLayout>
      {contextHolder}
      <div className="order-page-container">
        <form
          onSubmit={handleSubmit}
          className="order-page-card"
        >
          <div className="order-header-row">
            <h1 className="page-heading" style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#111" }}>
              Tạo đơn hàng
            </h1>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => router.back()}
              style={{ borderRadius: 6, height: 36 }}
            >
              Thoát
            </Button>
          </div>

          <div className="order-new-layout">
            {/* Cột trái: Form nhập và Bảng sản phẩm */}
            <div className="left-panel">
              {/* Nhóm chọn khách hàng */}
              <div className="field-group" style={{ marginBottom: 18 }}>
                <label
                  className="field-label"
                  style={{ fontWeight: 600, marginBottom: 6, display: "block", color: "#374151", fontSize: 14 }}
                >
                  Khách hàng <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <div>
                  <input
                    type="text"
                    readOnly
                    disabled
                    value={
                      user?.name
                        ? `${user.name} · ${user.email}`
                        : user?.email
                        ? `${user.email}`
                        : "Đang tải thông tin tài khoản..."
                    }
                    style={{
                      height: 40,
                      borderRadius: 6,
                      border: "1px solid #d1d5db",
                      padding: "0 12px",
                      width: "100%",
                      fontSize: 14,
                      color: "#374151",
                      backgroundColor: "#f9fafb",
                      cursor: "not-allowed",
                    }}
                  />
                </div>
              </div>

              {/* Hàng chọn sản phẩm + số lượng + nút thêm dòng */}
              <div className="order-create-product-row">
                <div className="field-group flex-1" style={{ flex: 1, minWidth: 0, margin: 0 }}>
                  <label
                    className="field-label"
                    style={{ fontWeight: 600, marginBottom: 6, display: "block", color: "#374151", fontSize: 14 }}
                  >
                    Sản phẩm
                  </label>
                  <Select
                    value={selectedProductId || undefined}
                    placeholder="Chọn sản phẩm"
                    onChange={(val) => {
                      setSelectedProductId(val);
                      setErrorMessage("");
                    }}
                    style={{ width: "100%", height: 40 }}
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

                <div className="field-group qty-group" style={{ margin: 0 }}>
                  <label
                    className="field-label"
                    style={{ fontWeight: 600, marginBottom: 6, display: "block", color: "#374151", fontSize: 14 }}
                  >
                    Số lượng
                  </label>
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      border: "1px solid #d1d5db",
                      borderRadius: 6,
                      overflow: "hidden",
                      backgroundColor: "#fff",
                      height: 40,
                    }}
                  >
                    <button
                      type="button"
                      disabled={selectedQuantity <= 1}
                      onClick={() => {
                        setSelectedQuantity((prev) => Math.max(1, prev - 1));
                        setErrorMessage("");
                      }}
                      style={{
                        width: 34,
                        height: 40,
                        border: "none",
                        background: "#f9fafb",
                        cursor: selectedQuantity <= 1 ? "not-allowed" : "pointer",
                        fontWeight: 700,
                        fontSize: 16,
                        color: selectedQuantity <= 1 ? "#9ca3af" : "#374151",
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
                      {selectedQuantity}
                    </span>
                    <button
                      type="button"
                      disabled={selectedQuantity >= 99}
                      onClick={() => {
                        setSelectedQuantity((prev) => Math.min(99, prev + 1));
                        setErrorMessage("");
                      }}
                      style={{
                        width: 34,
                        height: 40,
                        border: "none",
                        background: "#f9fafb",
                        cursor: selectedQuantity >= 99 ? "not-allowed" : "pointer",
                        fontWeight: 700,
                        fontSize: 16,
                        color: selectedQuantity >= 99 ? "#9ca3af" : "#374151",
                      }}
                    >
                      +
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  className="btn-add-row"
                  onClick={handleAddProduct}
                  style={{
                    height: 40,
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
                  Thêm dòng
                </button>
              </div>

              {/* Hộp lỗi màu đỏ */}
              {errorMessage && (
                <div
                  className="order-error-box"
                  style={{
                    backgroundColor: "#fef2f2",
                    border: "1px solid #f87171",
                    borderRadius: 6,
                    padding: "10px 14px",
                    color: "#dc2626",
                    fontSize: 14,
                    fontWeight: 500,
                    marginBottom: 16,
                  }}
                >
                  {errorMessage}
                </div>
              )}

              {/* Bảng sản phẩm đã chọn */}
              <div className="order-table-container">
                <table className="order-table order-table-responsive">
                  <thead>
                    <tr style={{ backgroundColor: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                      <th style={{ padding: "10px 14px", textAlign: "left", fontSize: 14, fontWeight: 600, width: "45%" }}>
                        Sản phẩm
                      </th>
                      <th style={{ padding: "10px 14px", textAlign: "right", fontSize: 14, fontWeight: 600, width: 120 }}>
                        Đơn giá
                      </th>
                      <th style={{ padding: "10px 14px", textAlign: "center", fontSize: 14, fontWeight: 600, width: 80 }}>
                        SL
                      </th>
                      <th style={{ padding: "10px 14px", textAlign: "right", fontSize: 14, fontWeight: 600, width: 130 }}>
                        Thành tiền
                      </th>
                      <th style={{ padding: "10px 14px", textAlign: "center", fontSize: 14, fontWeight: 600, width: 60 }}>
                        Xoá
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {cartItems.length > 0 ? (
                      cartItems.map((item) => (
                        <tr key={item.productId} style={{ borderBottom: "1px solid #f3f4f6" }}>
                          <td style={{ padding: "12px 14px", fontSize: 14, fontWeight: 500, color: "#111" }}>
                            <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                              <img
                                src={item.imageUrl || "/icon.png"}
                                alt={item.name}
                                style={{
                                  width: 40,
                                  height: 40,
                                  borderRadius: 6,
                                  objectFit: "contain",
                                  border: "1px solid #f3f4f6",
                                  backgroundColor: "#f9fafb",
                                  flexShrink: 0,
                                  marginTop: 2,
                                }}
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = "/icon.png";
                                }}
                              />
                              <CollapsibleProductName name={item.name || ""} />
                            </div>
                          </td>
                          <td style={{ padding: "12px 14px", textAlign: "right", fontSize: 14, color: "#374151" }}>
                            {item.price?.toLocaleString("vi-VN")}
                          </td>
                          <td style={{ padding: "12px 14px", textAlign: "center", fontSize: 14, fontWeight: 600 }}>
                            {item.quantity}
                          </td>
                          <td style={{ padding: "12px 14px", textAlign: "right", fontSize: 14, fontWeight: 600, color: "#111" }}>
                            {(item.price * item.quantity).toLocaleString("vi-VN")}
                          </td>
                          <td style={{ padding: "12px 14px", textAlign: "center" }}>
                            <button
                              type="button"
                              className="btn-delete-row"
                              onClick={() => handleRemoveItem(item.productId)}
                              style={{
                                border: "none",
                                background: "none",
                                color: "#ef4444",
                                fontSize: 16,
                                cursor: "pointer",
                                fontWeight: 700,
                              }}
                            >
                              ✕
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} style={{ textAlign: "center", padding: "28px", color: "#888", fontSize: 14 }}>
                          Chưa có sản phẩm nào trong đơn
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Cột phải: Danh sách chọn */}
            <div className="right-panel">
              <div
                className="side-card"
                style={{
                  border: "1px solid #d1d5db",
                  borderRadius: 8,
                  padding: "18px 20px",
                  backgroundColor: "#fff",
                }}
              >
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 14px 0", color: "#111" }}>
                  Danh sách chọn
                </h3>
                <div
                  className="side-list-scroll"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                    maxHeight: 460,
                    overflowY: "auto",
                    paddingRight: 6,
                  }}
                >
                  {products.length > 0 ? (
                    products.map((p: any) => {
                      const isOutOfStock = p.stock === 0;
                      const isInactive = p.status === "DEACTIVE" || p.status === "INACTIVE";
                      return (
                        <div
                          key={p.id}
                          style={{
                            opacity: isOutOfStock || isInactive ? 0.5 : 1,
                            paddingBottom: 10,
                            borderBottom: "1px solid #f3f4f6",
                          }}
                        >
                          <div
                            style={{
                              fontWeight: 600,
                              fontSize: 13.5,
                              color: isOutOfStock || isInactive ? "#6b7280" : "#111",
                              lineHeight: 1.35,
                            }}
                          >
                            {p.name}
                          </div>
                          <div style={{ fontSize: 12.5, color: "#6b7280", marginTop: 4 }}>
                            {isInactive ? "Ngừng bán" : isOutOfStock ? "Hết hàng" : `Còn ${p.stock}`}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div style={{ color: "#9ca3af", fontStyle: "italic", fontSize: 13 }}>
                      Không có sản phẩm nào
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Chân trang thanh toán và nút Tạo đơn */}
          <div className="order-bottom-bar">
            <div style={{ fontSize: 16, color: "#111", fontWeight: 700 }}>
              Tạm tính: <strong>{totalAmount.toLocaleString("vi-VN")} đ</strong>
            </div>

            <button
              type="submit"
              className="btn-create-order"
              disabled={submitting || cartItems.length === 0}
              style={{
                height: 42,
                padding: "0 28px",
                backgroundColor: cartItems.length === 0 ? "#e5e7eb" : "#dbeafe",
                border: "1.5px solid #2563eb",
                borderRadius: 6,
                color: cartItems.length === 0 ? "#9ca3af" : "#1d4ed8",
                fontWeight: 600,
                fontSize: 15,
                cursor: cartItems.length === 0 ? "not-allowed" : "pointer",
              }}
            >
              {submitting ? "Đang tạo..." : "Tạo đơn"}
            </button>
          </div>
        </form>
      </div>
    </ClientLayout>
  );
}
