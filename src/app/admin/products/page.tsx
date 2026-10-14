"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Table,
  Button,
  Input,
  Select,
  Space,
  Tag,
  Popconfirm,
  Image,
  message as antdMessage,
} from "antd";
import { PlusOutlined, PictureOutlined } from "@ant-design/icons";
import { useRouter, useSearchParams } from "next/navigation";
import { debounce } from "lodash";
import { useProducts, useMyProducts, useDeleteProduct } from "@/features/products/hooks";
import { ProductModal } from "@/features/products/components/ProductModal";
import { Product } from "@/features/products/types";
import styles from "./Product.module.scss";

type ProductWithImage = Product & {
  imageUrl?: string;
  image?: string;
  image_url?: string;
};

export default function ProductsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [messageApi, contextHolder] = antdMessage.useMessage();

  const page = Number(searchParams.get("page")) || 1;
  const name = searchParams.get("name") || undefined;
  const status = searchParams.get("status") || "";
  const sort = searchParams.get("sort") || "price,asc";

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

  const isProductOwner = userRole === "PRODUCT_OWNER";
  const isAdmin = userRole === "ADMIN";

  // ADMIN xem tất cả sản phẩm (useProducts).
  // PRODUCT_OWNER chỉ xem sản phẩm của chính mình (useMyProducts).
  const adminProductsQuery = useProducts(
    { page, size: 20, name, status: status || undefined, sort },
  );

  const poProductsQuery = useMyProducts(
    { page, size: 20, name, status: status || undefined, sort },
  );

  const { data, isLoading, isError } = isProductOwner ? poProductsQuery : adminProductsQuery;

  const { mutate: deleteProduct } = useDeleteProduct();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>();
  const [searchValue, setSearchValue] = useState(name || "");

  useEffect(() => {
    setSearchValue(name || "");
  }, [name]);

  const updateUrl = (updates: Record<string, string | null>, resetPage = false) => {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    if (resetPage) {
      params.set("page", "1");
    }

    router.push(`?${params.toString()}`);
  };

  const debouncedSearch = useMemo(
    () =>
      debounce((value: string) => {
        updateUrl({ name: value || null }, true);
      }, 300),
    [searchParams, router]
  );

  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);
    debouncedSearch(value);
  };

  const handleStatusChange = (value: string) => {
    debouncedSearch.cancel();
    updateUrl({ status: value || null }, true);
  };

  const handleSortChange = (value: string) => {
    debouncedSearch.cancel();
    updateUrl({ sort: value || null }, true);
  };

  const handleTableChange = (pagination: { current?: number }) => {
    updateUrl({ page: String(pagination.current || 1) });
  };

  const handleDelete = (id: number) => {
    deleteProduct(id, {
      onError: (err: any) => {
        messageApi.error(
          err?.response?.data?.message ||
            "Lỗi khi xóa sản phẩm. Sản phẩm có thể đã nằm trong đơn hàng."
        );
      },
    });
  };

  const products: Product[] = Array.isArray(data?.content)
    ? data.content
    : Array.isArray(data)
    ? data
    : [];

  const total = data?.totalElements ?? products.length;

  const baseColumns = [
    {
      title: "Hình ảnh",
      key: "image",
      width: 100,
      render: (_: unknown, record: Product) => {
        const item = record as ProductWithImage;
        const imageUrl = item.imageUrl || item.image || item.image_url;

        return imageUrl ? (
          <Image
            src={imageUrl}
            alt={record.name || "Ảnh sản phẩm"}
            width={48}
            height={48}
            className={styles.productImg}
            fallback="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48'%3E%3Crect width='100%25' height='100%25' fill='%23f5f5f5'/%3E%3C/svg%3E"
          />
        ) : (
          <div className={styles.imageBox}>
            <PictureOutlined className={styles.imageIcon} />
          </div>
        );
      },
    },
    {
      title: "Tên",
      dataIndex: "name",
      key: "name",
      render: (value: string) => <span className={styles.textName}>{value}</span>,
    },
    {
      title: "Giá (đ)",
      dataIndex: "price",
      key: "price",
      align: "left" as const,
      width: 150,
      render: (value: number) => (
        <span className={styles.textPrice}>{value?.toLocaleString("vi-VN") ?? "—"}</span>
      ),
    },
    {
      title: "Tồn kho",
      dataIndex: "stock",
      key: "stock",
      width: 100,
      render: (value: number) => <span className={styles.textStock}>{value ?? 0}</span>,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (value: string) => {
        const isActive = value === "ACTIVE";
        return (
          <Tag className={isActive ? styles.statusActive : styles.statusInactive}>
            {value || "UNKNOWN"}
          </Tag>
        );
      },
    },
  ];

  const columns = useMemo(() => {
    // ADMIN chỉ có quyền xem, không có quyền thêm sửa xóa
    if (isAdmin) {
      return baseColumns;
    }

    return [
      ...baseColumns,
      {
        title: "Thao tác",
        key: "action",
        width: 150,
        render: (_: unknown, record: Product) => (
          <Space separator={<span className={styles.actionSeparator}>·</span>} size={4}>
            <Button
              type="link"
              className={styles.btnEdit}
              onClick={() => {
                setEditingProduct(record);
                setIsModalOpen(true);
              }}
            >
              Sửa
            </Button>

            <Popconfirm
              title="Xác nhận xóa"
              description="Bạn có chắc chắn muốn xóa sản phẩm này?"
              onConfirm={() => handleDelete(record.id)}
              okText="Xóa"
              cancelText="Hủy"
            >
              <Button type="link" danger className={styles.btnDelete}>
                Xóa
              </Button>
            </Popconfirm>
          </Space>
        ),
      },
    ];
  }, [isAdmin]);

  return (
    <>
      {contextHolder}

      <div className={styles.productWrapper}>
        <div className={styles.headerRow}>
          <h2 className={styles.pageTitle}>Quản lí sản phẩm</h2>

          {isProductOwner && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              className={styles.btnAddProduct}
              onClick={() => {
                setEditingProduct(undefined);
                setIsModalOpen(true);
              }}
            >
              Thêm sản phẩm
            </Button>
          )}
        </div>

        <div className={styles.filterRow}>
          <Input
            placeholder="Tìm theo tên sản phẩm..."
            value={searchValue}
            onChange={handleSearchChange}
            allowClear
            className={styles.searchInput}
          />

          <Select
            value={status}
            onChange={handleStatusChange}
            className={styles.filterSelect}
            options={[
              { label: "Trạng thái: Tất cả", value: "" },
              { label: "ACTIVE", value: "ACTIVE" },
              { label: "INACTIVE", value: "INACTIVE" },
              { label: "DEACTIVE", value: "DEACTIVE" },
            ]}
          />

          <Select
            value={sort}
            onChange={handleSortChange}
            className={styles.sortSelect}
            options={[
              { label: "Sắp xếp: Giá tăng dần", value: "price,asc" },
              { label: "Sắp xếp: Giá giảm dần", value: "price,desc" },
              { label: "Sắp xếp: Tên A-Z", value: "name,asc" },
              { label: "Sắp xếp: Tên Z-A", value: "name,desc" },
            ]}
          />
        </div>

        <Table<Product>
          className={styles.productTable}
          columns={columns}
          dataSource={isError ? [] : products}
          rowKey="id"
          loading={isLoading}
          pagination={{
            current: page,
            pageSize: 20,
            total,
            showSizeChanger: false,
            showTotal: (count) => `Tổng ${count} sản phẩm`,
          }}
          onChange={handleTableChange}
          locale={{
            emptyText: isError
              ? "Có lỗi xảy ra khi tải dữ liệu từ máy chủ"
              : "Không có sản phẩm nào",
          }}
          scroll={{ x: 900 }}
        />

        <ProductModal
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          product={editingProduct}
        />
      </div>
    </>
  );
}