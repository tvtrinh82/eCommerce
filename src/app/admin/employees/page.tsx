"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Table,
  Button,
  Tag,
  Select,
  message,
  Card,
  Popconfirm,
  Typography,
} from "antd";
import { apiClient } from "@/lib/api-client";

const { Title, Text } = Typography;

export interface EmployeeUser {
  id: number;
  email: string;
  name?: string;
  username?: string;
  role: "ADMIN" | "PRODUCT_OWNER" | "USER" | string;
  status: "ACTIVE" | "INACTIVE" | "LOCKED" | string;
  createdAt?: string;
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<EmployeeUser[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [messageApi, contextHolder] = message.useMessage();

  // 1. Tải danh sách tài khoản thật từ Backend
  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      let rawList: any[] = [];

      // Ưu tiên endpoint lấy toàn bộ user quản trị
      try {
        const res: any = await apiClient.get("/admin/users");
        rawList = res.data?.data || res.data?.content || res.data || [];
      } catch (adminErr) {
        // Fallback sang endpoint lấy danh sách tài khoản nếu chưa có route admin riêng
        const resFallback: any = await apiClient.get("/customers?page=0&size=100");
        rawList = resFallback.data?.content || resFallback.data?.data || resFallback.data || [];
      }

      if (!Array.isArray(rawList)) {
        rawList = [];
      }

      // Map chuẩn xác từng trường từ DB vào giao diện
      const mapped: EmployeeUser[] = rawList.map((u: any) => ({
        id: u.id,
        email: u.email,
        name: u.fullName || u.name || u.username || u.email?.split("@")[0],
        username: u.username || u.email?.split("@")[0],
        // Lấy đúng role từ DB, mặc định USER nếu backend null
        role: (u.role || u.roles?.[0]?.name || u.roles?.[0] || "USER").toUpperCase(),
        // Lấy status từ DB hoặc cờ is_active / enabled
        status: (u.status || (u.enabled === false || u.isActive === 0 ? "INACTIVE" : "ACTIVE")).toUpperCase(),
        createdAt: u.createdAt || u.created_at,
      }));

      setEmployees(mapped);
    } catch (err: any) {
      console.error("Lỗi fetch users:", err);
      messageApi.error(err.response?.data?.message || "Không thể tải danh sách tài khoản từ máy chủ!");
    } finally {
      setLoading(false);
    }
  }, [messageApi]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  // 2. Cập nhật vai trò thực tế vào Backend
  const handleChangeRole = async (employee: EmployeeUser, newRole: string) => {
    const oldRole = employee.role;
    // Cập nhật optimistic UI trước
    setEmployees((prev) =>
      prev.map((e) => (e.id === employee.id ? { ...e, role: newRole } : e))
    );

    try {
      // Endpoint cập nhật role (thay đổi URL nếu backend của bạn dùng PUT /admin/users/{id} hoặc khác)
      await apiClient.patch(`/admin/users/${employee.id}/role`, { role: newRole });
      messageApi.success(`Đã cập nhật [${employee.email}] thành: ${newRole}`);
    } catch (err: any) {
      // Rollback lại state cũ nếu backend trả về lỗi (403, 500, ...)
      setEmployees((prev) =>
        prev.map((e) => (e.id === employee.id ? { ...e, role: oldRole } : e))
      );
      messageApi.error(
        err.response?.data?.message || `Lỗi cập nhật quyền cho [${employee.email}] trên máy chủ!`
      );
    }
  };

  // 3. Đổi trạng thái (Active / Inactive) vào Backend
  const handleToggleStatus = async (employee: EmployeeUser) => {
    const nextStatus = employee.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    const oldStatus = employee.status;

    setEmployees((prev) =>
      prev.map((e) => (e.id === employee.id ? { ...e, status: nextStatus } : e))
    );

    try {
      await apiClient.patch(`/admin/users/${employee.id}/status`, { status: nextStatus });
      messageApi.success(`Đã chuyển trạng thái sang: ${nextStatus === "ACTIVE" ? "Hoạt động" : "Tạm khóa"}`);
    } catch (err: any) {
      // Rollback lại nếu backend từ chối
      setEmployees((prev) =>
        prev.map((e) => (e.id === employee.id ? { ...e, status: oldStatus } : e))
      );
      messageApi.error(err.response?.data?.message || "Không thể cập nhật trạng thái trên máy chủ!");
    }
  };

  const columns = [
    {
      title: "Mã",
      dataIndex: "id",
      key: "id",
      width: 80,
      render: (id: number) => <span style={{ fontWeight: 600, color: "#1677ff" }}>#{id}</span>,
    },
    {
      title: "Tài khoản nhân sự",
      key: "name",
      render: (_: any, record: EmployeeUser) => (
        <div>
          <div style={{ fontWeight: 600, color: "#1f1f1f", fontSize: 14 }}>
            {record.name || record.username}
          </div>
          <div style={{ fontSize: 12, color: "#8c8c8c" }}>{record.email}</div>
        </div>
      ),
    },
    {
      title: "Phân quyền vai trò",
      dataIndex: "role",
      key: "role",
      render: (role: string, record: EmployeeUser) => (
        <Select
          value={role}
          style={{ width: 230 }}
          onChange={(newRole) => handleChangeRole(record, newRole)}
          options={[
            {
              value: "PRODUCT_OWNER",
              label: (
                <span>
                  <Tag color="cyan" style={{ marginRight: 6 }}>KHO</Tag>
                  Quản lý kho & Sản phẩm
                </span>
              ),
            },
            {
              value: "ADMIN",
              label: (
                <span>
                  <Tag color="red" style={{ marginRight: 6 }}>ADMIN</Tag>
                  Quản trị viên toàn quyền
                </span>
              ),
            },
            {
              value: "USER",
              label: (
                <span>
                  <Tag color="default" style={{ marginRight: 6 }}>USER</Tag>
                  Nhân viên tiêu chuẩn
                </span>
              ),
            },
          ]}
        />
      ),
    },
    {
      title: "Quyền hạn trong kho",
      key: "scope",
      render: (_: any, record: EmployeeUser) => {
        if (record.role === "ADMIN") {
          return <Tag color="gold">Toàn quyền hệ thống & Kho hàng</Tag>;
        }
        if (record.role === "PRODUCT_OWNER") {
          return <Tag color="blue">Quản lý tồn kho, duyệt xuất nhập sản phẩm</Tag>;
        }
        return <Tag color="default">Xem sản phẩm cơ bản</Tag>;
      },
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      align: "center" as const,
      width: 130,
      render: (status: string) => {
        const isActive = status === "ACTIVE";
        return (
          <Tag color={isActive ? "success" : "default"}>
            {isActive ? "Đang làm việc" : "Tạm khóa"}
          </Tag>
        );
      },
    },
    {
      title: "Thao tác",
      key: "action",
      align: "center" as const,
      width: 120,
      render: (_: any, record: EmployeeUser) => (
        <Popconfirm
          title={record.status === "ACTIVE" ? "Tạm khóa quyền tài khoản này?" : "Kích hoạt lại tài khoản?"}
          onConfirm={() => handleToggleStatus(record)}
          okText="Đồng ý"
          cancelText="Hủy"
        >
          <Button
            type="text"
            danger={record.status === "ACTIVE"}
            style={{ fontWeight: 500 }}
          >
            {record.status === "ACTIVE" ? "Tạm khóa" : "Kích hoạt"}
          </Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <Card
      style={{
        borderRadius: 12,
        border: "1px solid #dcdfe6",
        boxShadow: "none",
      }}
      styles={{ body: { padding: "20px 24px" } }}
    >
      {contextHolder}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <div>
          <Title level={4} style={{ margin: 0, fontWeight: 700, fontSize: 18, color: "#1f1f1f" }}>
            Phân quyền Nhân viên Quản lý kho
          </Title>
          <Text type="secondary" style={{ fontSize: 13 }}>
            Tự chọn vai trò trực tiếp (PRODUCT_OWNER: Quản lý kho & sản phẩm, ADMIN: Toàn quyền) cho nhân sự trong hệ thống
          </Text>
        </div>
      </div>

      <Table
        columns={columns}
        dataSource={employees.map((e) => ({ ...e, key: e.id }))}
        loading={loading}
        pagination={{ pageSize: 10 }}
      />
    </Card>
  );
}