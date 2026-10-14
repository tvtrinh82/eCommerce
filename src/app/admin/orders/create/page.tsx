"use client";

import React, { useState, useMemo } from "react";
import { message as antdMessage, Button } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { useCustomers } from "@/features/customers/hooks";
import { useProducts } from "@/features/products/hooks";
import { useCreateOrder } from "@/features/orders/hooks";

import styles from "./CreateOrder.module.scss";

export default function CreateOrderPage() {
  const router = useRouter();
  const [messageApi, contextHolder] = antdMessage.useMessage();

  const { data: customersData } = useCustomers({ page: 1, size: 1000 });
  const { data: productsData } = useProducts({ page: 1, size: 1000 });
  const { mutate: createOrder, isPending } = useCreateOrder();

  const customers = Array.isArray(customersData)
    ? customersData
    : customersData?.content || customersData?.data?.content || customersData?.data || [];

  const products = Array.isArray(productsData)
    ? productsData
    : productsData?.content || productsData?.data?.content || productsData?.data || [];

  const [selectedCustomerId, setSelectedCustomerId] = useState<number | string>(
    customers[0]?.id ?? ""
  );
  const [selectedProductId, setSelectedProductId] = useState<number | string>("");
  const [selectedQuantity, setSelectedQuantity] = useState<number>(1);

  const [cartItems, setCartItems] = useState<any[]>([]);

  React.useEffect(() => {
    if (!selectedCustomerId && customers.length > 0) {
      setSelectedCustomerId(customers[0].id);
    }
  }, [customers, selectedCustomerId]);

  const handleAddProduct = () => {
    if (!selectedProductId) {
      messageApi.warning("Vui lòng chọn sản phẩm");
      return;
    }
    const product = products.find((p: any) => String(p.id) === String(selectedProductId));
    if (!product) return;

    if (selectedQuantity < 1 || selectedQuantity > 99) {
      messageApi.warning("Số lượng (1–99)");
      return;
    }

    setCartItems((prev) => {
      const existing = prev.find((item) => String(item.productId) === String(selectedProductId));
      if (existing) {
        return prev.map((item) =>
          String(item.productId) === String(selectedProductId)
            ? { ...item, quantity: item.quantity + selectedQuantity }
            : item
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          price: product.price,
          stock: product.stock,
          quantity: selectedQuantity,
        },
      ];
    });

    setSelectedProductId("");
    setSelectedQuantity(1);
  };

  const handleRemoveItem = (productId: number) => {
    setCartItems((prev) => prev.filter((item) => item.productId !== productId));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId) {
      messageApi.error("Vui lòng chọn khách hàng");
      return;
    }

    if (cartItems.length === 0) {
      messageApi.error("Đơn hàng phải có ít nhất 1 sản phẩm");
      return;
    }

    for (const item of cartItems) {
      if (item.stock !== undefined && item.quantity > item.stock) {
        messageApi.error(`Sản phẩm "${item.name}" không đủ hàng, chỉ còn ${item.stock}`);
        return;
      }
    }

    const payload = {
      customerId: Number(selectedCustomerId),
      items: cartItems.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
    };

    createOrder(payload, {
      onSuccess: (res: any) => {
        messageApi.success("Tạo đơn hàng thành công!");
        const orderId = res?.data?.id || res?.data?.[0]?.id;
        setTimeout(() => {
          if (orderId) {
            router.push(`/admin/orders/${orderId}`);
          } else {
            router.push("/admin/orders");
          }
        }, 1000);
      },
      onError: (err: any) => {
        messageApi.error(err?.response?.data?.message || "Có lỗi xảy ra khi tạo đơn hàng");
      },
    });
  };

  const totalAmount = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0);
  }, [cartItems]);

  return (
    <>
      {contextHolder}
      <form onSubmit={handleSubmit} className="order-page-card">
        <div className={styles.headerWrap}>
          <h1 className={`page-heading ${styles.heading}`}>Tạo đơn hàng</h1>
        </div>

        <div className="main-layout">
          {/* Cột trái: Form nhập và Bảng sản phẩm */}
          <div className="left-panel">
            {/* Nhóm chọn khách hàng */}
            <div className="field-group">
              <label className="field-label">Khách hàng </label>
              <div className="select-wrapper">
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="custom-select"
                >
                  {customers.length > 0 ? (
                    customers.map((c: any) => (
                      <option key={c.id} value={c.id}>
                        {c.name} · {c.email}
                      </option>
                    ))
                  ) : (
                    <option value="">Trần Văn T · tranvtrinh@gmail.com</option>
                  )}
                </select>
                <span className="dropdown-arrow">▼</span>
              </div>
            </div>

            {/* Hàng chọn sản phẩm + số lượng + nút thêm */}
            <div className="product-input-row">
              <div className="field-group flex-1">
                <label className="field-label">Sản phẩm</label>
                <div className="select-wrapper">
                  <select
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    className="custom-select"
                  >
                    <option value="">Chọn sản phẩm</option>
                    {products.map((p: any) => {
                      const isOutOfStock = p.stock === 0;
                      const isInactive = p.status === "DEACTIVE" || p.status === "INACTIVE";
                      const statusNote = isInactive
                        ? " (Ngừng bán)"
                        : isOutOfStock
                          ? " (Hết hàng)"
                          : ` (Còn ${p.stock})`;
                      return (
                        <option
                          key={p.id}
                          value={p.id}
                          disabled={isOutOfStock || isInactive}
                        >
                          {p.name} {statusNote}
                        </option>
                      );
                    })}
                  </select>
                  {/* <span className="dropdown-arrow">▼</span> */}
                </div>
              </div>

              <div className="field-group qty-group">
                <label className="field-label">Số lượng (1–99)</label>
                <input
                  type="number"
                  min={1}
                  max={99}
                  value={selectedQuantity}
                  onChange={(e) => setSelectedQuantity(Number(e.target.value) || 1)}
                  className="custom-input-qty"
                />
              </div>

              <button
                type="button"
                className="btn-add-row"
                onClick={handleAddProduct}
              >
                Thêm sản phẩm
              </button>
            </div>

            {/* Bảng sản phẩm đã chọn */}
            <table className="order-table">
              <thead>
                <tr>
                  <th className="th-product">Sản phẩm</th>
                  <th className="th-price">Đơn giá</th>
                  <th className="th-qty">SL</th>
                  <th className="th-total">Thành tiền</th>
                  <th className="th-action">Xoá</th>
                </tr>
              </thead>
              <tbody>
                {cartItems.map((item) => (
                  <tr key={item.productId}>
                    <td className="td-product">{item.name}</td>
                    <td className="td-price">{item.price?.toLocaleString("vi-VN")}</td>
                    <td className="td-qty">{item.quantity}</td>
                    <td className="td-total">
                      {(item.price * item.quantity).toLocaleString("vi-VN")}
                    </td>
                    <td className="td-action">
                      <button
                        type="button"
                        className="btn-delete-row"
                        onClick={() => handleRemoveItem(item.productId)}
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Cột phải: Danh sách chọn */}
          <div className="right-panel">
            <div className="side-card">
              <h3 className="side-card-title">Danh sách chọn</h3>
              <div className="side-list-items">
                {cartItems.length > 0 ? (
                  cartItems.map((item) => (
                    <div key={item.productId} className="side-item">
                      <div className="side-item-name">{item.name}</div>
                      <div className="side-item-status">
                        SL: {item.quantity} · Tổng: {(item.price * item.quantity).toLocaleString("vi-VN")} đ
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="side-item side-item-dimmed">
                    <div className="side-item-status">Chưa có sản phẩm</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>


        {/* Chân trang thanh toán và nút Tạo đơn */}
        <div className="bottom-bar">
          <div className="note-text">
            {/* <Button icon={<ArrowLeftOutlined />} onClick={() => router.back()}>
              Thoát
            </Button> */}
                
          </div>

          <div className="submit-section">
            <div className="calc-summary">
              Tạm tính: <strong>{totalAmount.toLocaleString("vi-VN")} đ</strong>
            </div>

            <button
              type="submit"
              className="btn-create-order"
              disabled={isPending}
            >
              {isPending ? "Đang tạo..." : "Tạo đơn"}
            </button>
          </div>
        </div>
      </form>
    </>
  );
}