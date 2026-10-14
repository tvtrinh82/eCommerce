"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Table, Button, Tag, Space, Popconfirm, message } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useSearchParams, useRouter } from "next/navigation";

import { useCustomers, useDeleteCustomer } from "@/features/customers/hooks";

import { Customer } from "@/features/customers/types";
import { CustomerModal } from "@/features/customers/components/CustomerModal";

import styles from "./Customer.module.scss";

export default function CustomersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const page = Number(searchParams.get("page")) || 1;

  const {
    data: customersData,
    isLoading,
    isError,
  } = useCustomers({ page, size: 20 });

  const { mutate: deleteCustomer } = useDeleteCustomer();

  const [messageApi, contextHolder] = message.useMessage();

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<
    Customer | undefined
  >();
  const [userRole, setUserRole] = useState<string>("");

  useEffect(() => {
    try {
      const storedRole = localStorage.getItem("role");
      if (storedRole) {
        setUserRole(storedRole.toUpperCase());
      } else {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          const r = parsed?.role || parsed?.roles?.[0]?.name || parsed?.roles?.[0] || "";
          setUserRole(String(r).toUpperCase());
        }
      }
    } catch {}
  }, []);

  const isAdminUser = (c: Customer) => {
    const email = (c.email || "").toLowerCase().trim();
    const name = (c.name || "").toLowerCase().trim();
    return (
      email.includes("admin") ||
      name.includes("admin") ||
      name.includes("quản trị viên") ||
      (c as any).role === "ADMIN"
    );
  };

  const rawList: Customer[] = Array.isArray(customersData?.content)
    ? customersData.content
    : Array.isArray(customersData)
      ? customersData
      : [];

  const customers: Customer[] = rawList.filter((c: Customer) => !isAdminUser(c));

  const totalElements = customersData?.totalElements
    ? Math.max(0, customersData.totalElements - (rawList.length - customers.length))
    : customers.length;

  const showModal = (customer?: Customer) => {
    setSelectedCustomer(customer);
    setIsModalVisible(true);
  };

  const handleTableChange = (pagination: { current?: number }) => {
    const params = new URLSearchParams(searchParams.toString());

    params.set("page", String(pagination.current || 1));

    router.push(`?${params.toString()}`);
  };

  const handleDelete = (id: number) => {
    deleteCustomer(id, {
      onSuccess: () => {
        messageApi.success("Xóa khách hàng thành công");
      },
      onError: (err: any) => {
        messageApi.error(
          err?.response?.data?.message ||
            "Không thể xóa khách hàng này. Khách hàng có thể đã phát sinh đơn hàng.",
        );
      },
    });
  };

  const baseColumns = [
    {
      title: "Họ tên",
      dataIndex: "name",
      key: "name",
      render: (value: string) => (
        <span className={styles.customerName}>{value || "—"}</span>
      ),
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      render: (value: string) => (
        <span className={styles.customerEmail}>{value || "—"}</span>
      ),
    },
    {
      title: "Số điện thoại",
      dataIndex: "phone",
      key: "phone",
      width: 180,
      render: (value: string) => <span className={styles.customerPhone}>{value || "—"}</span>,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 150,
      render: (status: string) => {
        const isActive = status === "ACTIVE";

        return (
          <Tag
            className={
              isActive
                ? styles.statusActive
                : styles.statusInactive
            }
          >
            {status || "UNKNOWN"}
          </Tag>
        );
      },
    },
  ];

  const columns = useMemo(() => {
    // Chỉ ADMIN mới có quyền thêm/sửa/xóa khách hàng. PRODUCT_OWNER có quyền xem danh sách khách hàng.
    if (userRole === "PRODUCT_OWNER") {
      return baseColumns;
    }

    return [
      ...baseColumns,
      {
        title: "Thao tác",
        key: "action",
        width: 170,
        render: (_: unknown, record: Customer) => (
          <Space
            size={5}
            separator={<span className={styles.actionSeparator}>·</span>}
          >
            <Button
              type="link"
              className={styles.btnEdit}
              onClick={() => showModal(record)}
            >
              Sửa
            </Button>

            <Popconfirm
              title="Xác nhận xóa"
              description="Bạn có chắc chắn muốn xóa khách hàng này?"
              onConfirm={() => handleDelete(record.id)}
              okText="Xóa"
              cancelText="Hủy"
            >
              <Button type="link" className={styles.btnDelete} danger>
                Xóa
              </Button>
            </Popconfirm>
          </Space>
        ),
      },
    ];
  }, [userRole]);

  return (
    <>
      {contextHolder}

      <div className={styles.customerWrapper}>
        {/* Tiêu đề và nút thêm */}
        <div className={styles.headerRow}>
          <h2 className={styles.pageTitle}>Quản lý khách hàng</h2>

          {userRole !== "PRODUCT_OWNER" && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              className={styles.btnAddCustomer}
              onClick={() => showModal()}
            >
              Thêm khách hàng
            </Button>
          )}
        </div>

        {/* Bảng khách hàng */}
        <Table<Customer>
          className={styles.customerTable}
          columns={columns}
          dataSource={
            isError
              ? []
              : customers.map((customer) => ({
                  ...customer,
                  key: customer.id,
                }))
          }
          rowKey="id"
          loading={isLoading}
          pagination={{
            current: page,
            pageSize: 20,
            total: totalElements,
            showSizeChanger: false,
            showTotal: (total) => `Tổng ${total} khách hàng`,
          }}
          onChange={handleTableChange}
          locale={{
            emptyText: isError
              ? "Có lỗi xảy ra khi tải dữ liệu"
              : "Không có khách hàng nào",
          }}
          scroll={{ x: 850 }}
        />
      </div>

      {/* Modal thêm và sửa khách hàng */}
      <CustomerModal
        open={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        customer={selectedCustomer}
      />

    </>
  );
}
