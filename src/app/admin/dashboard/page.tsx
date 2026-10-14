"use client";

import React, { useState, useEffect } from "react";
import { Table, Button, Card, Row, Col, Statistic, Select, Space, Tag, message } from "antd";
import { FileWordOutlined, FilePdfOutlined, DownloadOutlined, BarChartOutlined, CheckCircleOutlined, DollarOutlined, ShoppingCartOutlined, ReloadOutlined } from "@ant-design/icons";
import { fetchAllOrders } from "@/features/dashboard/api";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import styles from "./DashboardReports.module.scss";
dayjs.extend(isBetween);

export default function ReportsPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [wordExporting, setWordExporting] = useState(false);
  const [timeRange, setTimeRange] = useState<"today" | "7days" | "30days" | "all">("30days");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchAllOrders();
      setOrders(data);
    } catch (e) {
      console.error(e);
      message.error("Không thể tải danh sách đơn hàng cho báo cáo!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Lọc dữ liệu theo thời gian và trạng thái
  const now = dayjs();
  const filteredOrders = orders.filter((order) => {
    // Lọc theo trạng thái
    if (statusFilter !== "ALL") {
      if (statusFilter === "PAID") {
        const isPaid =
          order.paymentStatus === "PAID" ||
          order.status === "PAID" ||
          order.status === "COMPLETED" ||
          order.status === "PROCESSING";
        if (!isPaid) return false;
      } else {
        if (order.status !== statusFilter) return false;
      }
    }

    // Lọc theo thời gian
    const orderDate = dayjs(order.createdAt);
    if (timeRange === "today") {
      return orderDate.format("YYYY-MM-DD") === now.format("YYYY-MM-DD");
    }
    if (timeRange === "7days") {
      return orderDate.isAfter(now.subtract(7, "day").startOf("day"));
    }
    if (timeRange === "30days") {
      return orderDate.isAfter(now.subtract(30, "day").startOf("day"));
    }
    return true;
  });

  // Tính các chỉ số KPI
  let totalRevenue = 0;
  let paidCount = 0;
  filteredOrders.forEach((o) => {
    const isPaid =
      o.paymentStatus === "PAID" ||
      o.status === "PAID" ||
      o.status === "COMPLETED" ||
      o.status === "PROCESSING";

    if (isPaid) {
      totalRevenue += Number(o.totalAmount) || 0;
      paidCount++;
    }
  });

  const totalCount = filteredOrders.length;
  const avgOrderValue = paidCount > 0 ? Math.round(totalRevenue / paidCount) : 0;

  // 1. Xuất file Word (.docx) từ backend API /api/export/word
  const handleExportWord = async () => {
    setWordExporting(true);
    try {
      const res = await fetch("/api/export/word", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
      });
      if (!res.ok) throw new Error("Xuất file Word thất bại");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `BaoCao_DoanhThu_${dayjs().format("YYYYMMDD_HHmm")}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      message.success("Xuất báo cáo Word thành công!");
    } catch (e: any) {
      message.error(e?.message || "Lỗi khi xuất file Word");
    } finally {
      setWordExporting(false);
    }
  };

  // 2. Xuất hóa đơn Jasper PDF từ backend /api/jasper/orders/{id}/pdf
  const handleExportJasperPdf = async (orderId: number) => {
    try {
      message.loading({ content: `Đang xuất hóa đơn Jasper PDF #${orderId}...`, key: "pdf" });
      const res = await fetch(`/api/jasper/orders/${orderId}/pdf`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
      });
      if (!res.ok) {
        // Fallback sang endpoint hóa đơn PDF chuẩn
        const resFallback = await fetch(`/api/orders/${orderId}/pdf`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          },
        });
        if (!resFallback.ok) throw new Error("Không thể tạo hóa đơn PDF cho đơn hàng này");
        const blob = await resFallback.blob();
        triggerDownloadBlob(blob, `Invoice_Order_${orderId}.pdf`);
        message.success({ content: "Tải hóa đơn PDF thành công!", key: "pdf" });
        return;
      }
      const blob = await res.blob();
      triggerDownloadBlob(blob, `Jasper_Invoice_Order_${orderId}.pdf`);
      message.success({ content: "Xuất hóa đơn Jasper PDF thành công!", key: "pdf" });
    } catch (e: any) {
      message.error({ content: e?.message || "Lỗi xuất PDF", key: "pdf" });
    }
  };

  const triggerDownloadBlob = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // 3. Xuất file CSV / Excel
  const handleExportCsv = () => {
    if (filteredOrders.length === 0) {
      message.warning("Không có dữ liệu đơn hàng trong kỳ để xuất!");
      return;
    }
    const headers = ["Mã đơn", "Khách hàng", "Email", "Tổng tiền (VNĐ)", "Trạng thái", "Thanh toán", "Ngày tạo"];
    const rows = filteredOrders.map((o) => [
      `#${o.id}`,
      `"${o.customerName || "Khách lẻ"}"`,
      `"${o.customerEmail || ""}"`,
      o.totalAmount || 0,
      o.status,
      o.paymentStatus || "UNPAID",
      dayjs(o.createdAt).format("DD/MM/YYYY HH:mm:ss"),
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    triggerDownloadBlob(blob, `BaoCao_DonHang_${dayjs().format("YYYYMMDD_HHmm")}.csv`);
    message.success("Xuất file CSV thành công!");
  };

  const columns = [
    {
      title: "Mã đơn",
      dataIndex: "id",
      key: "id",
      width: 100,
      render: (id: number) => <span className={styles.orderId}>#{id}</span>,
    },
    {
      title: "Khách hàng",
      key: "customer",
      render: (_: any, r: any) => (
        <div>
          <div className={styles.customerName}>{r.customerName || "Khách hàng"}</div>
          <div className={styles.customerEmail}>{r.customerEmail}</div>
        </div>
      ),
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 170,
      render: (t: string) => dayjs(t).format("DD/MM/YYYY HH:mm"),
    },
    {
      title: "Tổng tiền",
      dataIndex: "totalAmount",
      key: "totalAmount",
      render: (amt: number) => (
        <span className={styles.totalAmount}>
          {Number(amt || 0).toLocaleString("vi-VN")} đ
        </span>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (st: string) => {
        let color = "default";
        let label = "Chờ duyệt";
        if (st === "COMPLETED") { color = "green"; label = "Hoàn thành"; }
        else if (st === "CONFIRMED") { color = "blue"; label = "Đã xác nhận"; }
        else if (st === "PROCESSING") { color = "blue"; label = "Đang xử lý / Giao"; }
        else if (st === "PAID") { color = "green"; label = "Đã thanh toán"; }
        else if (st === "AWAITING_PAYMENT") { color = "gold"; label = "Chờ thanh toán"; }
        else if (st === "CANCELLED") { color = "red"; label = "Đã hủy"; }
        else if (st === "PENDING") { color = "gold"; label = "Chờ duyệt"; }
        else if (st === "REFUND_REQUESTED") { color = "purple"; label = "Yêu cầu hoàn tiền"; }
        else if (st === "REFUNDED") { color = "default"; label = "Đã hoàn tiền"; }
        return <Tag color={color}>{label}</Tag>;
      },
    },
    {
      title: "Thanh toán",
      dataIndex: "paymentStatus",
      key: "paymentStatus",
      render: (ps: string) => {
        const isPaid = ps === "PAID" || ps === "SUCCESS";
        return (
          <Tag color={isPaid ? "success" : "default"}>
            {isPaid ? "Đã thanh toán" : "Chưa thanh toán"}
          </Tag>
        );
      },
    },
    {
      title: "Thao tác xuất",
      key: "actions",
      width: 160,
      render: (_: any, r: any) => (
        <Button
          size="small"
          icon={<FilePdfOutlined />}
          className={styles.btnPdf}
          onClick={() => handleExportJasperPdf(r.id)}
        >
          Jasper PDF
        </Button>
      ),
    },
  ];

  return (
    <div className={styles.wrapper}>
      <div className={styles.headerRow}>
        <div>
          <h2 className={styles.pageTitle}>Báo cáo Doanh thu & Đơn hàng</h2>
          <p className={styles.pageSubtitle}>Tổng hợp chỉ số kinh doanh và xuất báo cáo tài liệu tự động</p>
        </div>
        <Space>
          <Button
            type="primary"
            icon={<FileWordOutlined />}
            loading={wordExporting}
            onClick={handleExportWord}
            className={styles.btnWord}
          >
            Xuất Word (.docx)
          </Button>
          <Button
            icon={<DownloadOutlined />}
            onClick={handleExportCsv}
            className={styles.btnCsv}
          >
            Xuất Excel/CSV
          </Button>
        </Space>
      </div>

      <div className="reports-filter-bar">
        <Space size="middle">
          <span>Kỳ báo cáo:</span>
          <Select
            value={timeRange}
            onChange={(v) => setTimeRange(v)}
            className={styles.selectTimeRange}
            options={[
              { value: "today", label: "Hôm nay" },
              { value: "7days", label: "7 ngày qua" },
              { value: "30days", label: "30 ngày qua" },
              { value: "all", label: "Toàn bộ thời gian" },
            ]}
          />
          <span>Trạng thái:</span>
          <Select
            value={statusFilter}
            onChange={(v) => setStatusFilter(v)}
            className={styles.selectStatus}
            options={[
              { value: "ALL", label: "Tất cả trạng thái" },
              { value: "PAID", label: "Đã thanh toán" },
              { value: "CONFIRMED", label: "Đã xác nhận" },
              { value: "PROCESSING", label: "Đang xử lý / Giao" },
              { value: "COMPLETED", label: "Hoàn thành" },
              { value: "PENDING", label: "Chờ duyệt" },
              { value: "AWAITING_PAYMENT", label: "Chờ thanh toán" },
              { value: "CANCELLED", label: "Đã hủy" },
            ]}
          />
        </Space>
      </div>

      <Row gutter={16} className={styles.statRow}>
        <Col span={6}>
          <Card size="small" className="stat-card">
            <Statistic
              title="Tổng doanh thu kỳ này"
              value={totalRevenue}
              suffix="đ"
              styles={{ content: { color: "#0958d9", fontWeight: 700 } }}
              prefix={<DollarOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small" className="stat-card">
            <Statistic
              title="Tổng số đơn hàng"
              value={totalCount}
              styles={{ content: { color: "#1f1f1f", fontWeight: 700 } }}
              prefix={<ShoppingCartOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small" className="stat-card">
            <Statistic
              title="Đơn đã thanh toán (PAID)"
              value={paidCount}
              styles={{ content: { color: "#389e0d", fontWeight: 700 } }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small" className="stat-card">
            <Statistic
              title="Giá trị TB / đơn (AOV)"
              value={avgOrderValue}
              suffix="đ"
              styles={{ content: { color: "#d46b08", fontWeight: 700 } }}
              prefix={<BarChartOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <div className={styles.tableSummaryHeader}>
        Chi tiết danh sách đơn hàng ({filteredOrders.length} đơn)
      </div>

      <Table
        columns={columns}
        dataSource={filteredOrders}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10, showTotal: (t) => `Tổng ${t} đơn hàng` }}
        bordered
      />
    </div>
  );
}