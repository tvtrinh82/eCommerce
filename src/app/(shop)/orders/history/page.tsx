"use client";

import React, { useEffect, useState } from "react";
import { Typography, Table, Tag, message, Button } from "antd";
import { EyeOutlined, ShoppingOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import ClientLayout from "@/components/shared/ClientLayout";
import dayjs from "dayjs";
import { apiClient } from "@/lib/api-client";
import { formatCurrency } from "@/lib/format";

const { Title } = Typography;

export default function OrderHistoryPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;

    const fetchHistory = async (isInitial = false) => {
      if (isInitial) setLoading(true);
      const token = localStorage.getItem("token");
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

    // Auto-polling mỗi 4 giây và tự reload khi người dùng quay lại tab
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
      title: 'Mã đơn',
      dataIndex: 'id',
      key: 'id',
      render: (id: number) => <strong>#{id}</strong>
    },
    {
      title: 'Ngày đặt',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string, record: any) => {
        const d = date || record.orderDate;
        return d ? dayjs(d).format('DD/MM/YYYY HH:mm') : '-';
      }
    },
    {
      title: 'Sản phẩm',
      key: 'products',
      render: (_: any, record: any) => {
        if (!record.items || record.items.length === 0) return <span style={{ color: 'gray' }}>Đang cập nhật...</span>;
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {record.items.map((item: any, idx: number) => (
              <div key={idx}>- {item.productName || item.name} <strong>(x{item.quantity})</strong></div>
            ))}
          </div>
        );
      }
    },
    {
      title: 'Tổng tiền',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (amount: number) => amount ? <strong style={{ color: '#ff4d4f' }}>{formatCurrency(amount)}</strong> : '-'
    },
    {
      title: 'Trạng thái đơn',
      dataIndex: 'status',
      key: 'status',
      render: (status: string, record: any) => {
        const st = status || record.orderStatus;
        let color = "blue";
        if (st === "COMPLETED") color = "green";
        else if (st === "CANCELLED") color = "red";
        else if (st === "PENDING") color = "orange";
        return <Tag color={color}>{st || 'PENDING'}</Tag>;
      }
    },
    {
      title: 'Thanh toán',
      dataIndex: 'paymentStatus',
      key: 'paymentStatus',
      render: (status: string) => {
        let color = "blue";
        if (status === "PAID") color = "green";
        else if (status === "FAILED" || status === "CANCELLED") color = "red";
        else if (status === "PENDING" || status === "UNPAID") color = "orange";
        return <Tag color={color}>{status || 'PENDING'}</Tag>;
      }
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_: any, record: any) => (
        <Button 
          type="primary" 
          icon={<EyeOutlined />} 
          onClick={() => router.push(`/orders/${record.id}`)}
          size="small"
        >
          Chi tiết
        </Button>
      )
    }
  ];

  return (
    <ClientLayout>
      <div style={{ padding: "40px 10%", maxWidth: 1400, margin: "0 auto", minHeight: "60vh" }}>
        <Title level={2} style={{ marginBottom: 30 }}><ShoppingOutlined /> Lịch sử mua hàng</Title>
        <Table 
          bordered
          columns={columns} 
          dataSource={orders} 
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </div>
    </ClientLayout>
  );
}
