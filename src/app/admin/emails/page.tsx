"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Table, Button, Select, Tooltip, App } from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import { apiClient } from "@/lib/api-client";
import dayjs from "dayjs";
import styles from "./Emails.module.scss";

export interface FailedEmailItem {
  id: string | number;
  recipient: string;        // Người nhận
  emailType: string;        // Loại mail
  retryCount: number;       // Số lần thử
  lastError: string;        // Lỗi gần nhất (lấy từ BE ghi lại)
  createdAt: string;        // Thời điểm tạo
  status: "FAILED" | "PENDING" | "SENT" | "RESOLVED" | string;
}

export default function FailedEmailsPage() {
  const { message } = App.useApp();
  const [emails, setEmails] = useState<FailedEmailItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [statusFilter, setStatusFilter] = useState<string>("FAILED");
  const [actionLoadingId, setActionLoadingId] = useState<string | number | null>(null);

  // Quản lý phân trang Server-side
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });

  // Gọi trực tiếp API backend lấy danh sách mail gửi lỗi
  const fetchEmails = useCallback(async (page = 1, size = 20, status = statusFilter) => {
    setLoading(true);
    try {
      // Backend thường phân trang 0-indexed hoặc 1-indexed, ở đây truyền cả page/size
      const res: any = await apiClient.get("/admin/failed-emails", {
        params: {
          page: page - 1,
          size: size,
          status: status === "ALL" ? undefined : status,
        },
      });

      // Hỗ trợ cấu trúc trả về Spring Pageable: res.data.content hoặc res.data
      const content = res?.data?.content || res?.content || (Array.isArray(res?.data) ? res.data : []);
      const totalElements = res?.data?.totalElements || res?.totalElements || content.length;

      // Chuẩn hoá dữ liệu theo các trường BE trả về
      const mappedList: FailedEmailItem[] = content.map((item: any) => ({
        id: item.id,
        recipient: item.recipient || item.recipientEmail || item.to || item.userEmail || "",
        emailType: item.emailType || item.type || item.template || "ORDER_PAID",
        retryCount: item.retryCount ?? item.retries ?? item.retryTimes ?? 0,
        lastError: item.lastError || item.errorMessage || item.reason || item.message || "",
        createdAt: item.createdAt || item.createdDate || item.time || new Date().toISOString(),
        status: item.status || "FAILED",
      }));

      setEmails(mappedList);
      setPagination((prev) => ({
        ...prev,
        current: page,
        pageSize: size,
        total: totalElements,
      }));
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || "Không thể tải danh sách mail gửi lỗi từ máy chủ!";
      message.error(errorMsg);
      setEmails([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  // Tải lại khi thay đổi filter hoặc mount
  useEffect(() => {
    fetchEmails(1, pagination.pageSize, statusFilter);
  }, [fetchEmails, statusFilter]);

  // Xử lý gửi lại từng dòng
  const handleResend = async (record: FailedEmailItem) => {
    // 1. Kiểm tra trạng thái cục bộ trước
    if (record.status !== "FAILED") {
      message.error("Mail không còn ở FAILED");
      fetchEmails(pagination.current, pagination.pageSize);
      return;
    }

    setActionLoadingId(record.id);
    try {
      // 2. Gửi request retry lên BE
      const res: any = await apiClient.post(`/admin/failed-emails/${record.id}/retry`);
      message.success(res?.data?.message || "Đã gửi lại thành công!");
    } catch (err: any) {
      // 3. Nếu BE trả về mail không còn ở FAILED thì báo lỗi
      const serverMessage = err?.response?.data?.message || "";
      if (err?.response?.status === 400 || serverMessage.toLowerCase().includes("failed")) {
        message.error("Mail không còn ở FAILED");
      } else {
        message.error(serverMessage || "Gửi lại thất bại, vui lòng thử lại sau!");
      }
    } finally {
      setActionLoadingId(null);
      // Gửi xong -> tải lại danh sách
      fetchEmails(pagination.current, pagination.pageSize);
    }
  };

  const handleTableChange = (newPagination: TablePaginationConfig) => {
    fetchEmails(
      newPagination.current || 1,
      newPagination.pageSize || 20,
      statusFilter
    );
  };

  // Cấu hình các cột hiển thị theo đúng yêu cầu
  const columns: ColumnsType<FailedEmailItem> = [
    {
      title: "Người nhận",
      dataIndex: "recipient",
      key: "recipient",
      width: "22%",
      render: (text: string) => <span className={styles.recipientText}>{text}</span>,
    },
    {
      title: "Loại mail",
      dataIndex: "emailType",
      key: "emailType",
      width: "16%",
      render: (text: string) => <span className={styles.emailTypeText}>{text}</span>,
    },
    {
      title: "Số lần thử",
      dataIndex: "retryCount",
      key: "retryCount",
      width: "12%",
      align: "center",
      render: (count: number) => <span>{count}</span>,
    },
    {
      title: "Lỗi gần nhất",
      dataIndex: "lastError",
      key: "lastError",
      width: "26%",
      render: (errorMsg: string) => (
        <Tooltip title={errorMsg} placement="topLeft">
          <div className={styles.errorText}>
            {errorMsg || "(Không có log lỗi)"}
          </div>
        </Tooltip>
      ),
    },
    {
      title: "Tạo lúc",
      dataIndex: "createdAt",
      key: "createdAt",
      width: "14%",
      render: (time: string) => (
        <span className={styles.dateText}>
          {time ? dayjs(time).format("DD/MM/YYYY HH:mm") : "-"}
        </span>
      ),
    },
    {
      title: "Thao tác",
      key: "action",
      width: "10%",
      align: "center",
      render: (_: any, record: FailedEmailItem) => (
        <Button
          type="default"
          className={styles.resendBtn}
          loading={actionLoadingId === record.id}
          disabled={record.status !== "FAILED"}
          onClick={() => handleResend(record)}
        >
          Gửi lại
        </Button>
      ),
    },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <h2 className={styles.headerTitle}>
          Mail gửi lỗi
        </h2>

        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>Trạng thái:</span>
          <Select
            value={statusFilter}
            onChange={(val) => setStatusFilter(val)}
            className={styles.filterSelect}
            options={[
              { value: "FAILED", label: "FAILED" },
              { value: "ALL", label: "Tất cả" },
              { value: "PENDING", label: "PENDING" },
              { value: "SENT", label: "SENT" },
            ]}
          />
        </div>
      </div>

      <Table
        columns={columns}
        dataSource={emails}
        rowKey="id"
        loading={loading}
        onChange={handleTableChange}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          defaultPageSize: 20,
          pageSizeOptions: ["10", "20", "50"],
          showSizeChanger: true,
          locale: { items_per_page: "/ trang" },
        }}
      />
    </div>
  );
}