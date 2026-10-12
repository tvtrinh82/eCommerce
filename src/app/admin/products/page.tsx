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
  Flex,
  Image,
  message as antdMessage,
} from "antd";
import { PlusOutlined, PictureOutlined } from "@ant-design/icons";
import { useRouter, useSearchParams } from "next/navigation";
import { debounce } from "lodash";
import { useProducts, useDeleteProduct } from "@/features/products/hooks";
import { ProductModal } from "@/features/products/components/ProductModal";
import { Product } from "@/features/products/types";

type ProductWithImage = Product & {
  imageUrl?: string;
  image?: string;
  image_url?: string;
};

export default function ProductsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [messageApi, contextHolder] = antdMessage.useMessage();

  // Lấy bộ lọc từ URL
  const page = Number(searchParams.get("page")) || 1;
  const name = searchParams.get("name") || undefined;
  const status = searchParams.get("status") || "";
  const sort = searchParams.get("sort") || "price,asc";

  const { data, isLoading, isError } = useProducts({
    page,
    size: 20,
    name,
    status: status || undefined,
    sort,
  });

  const { mutate: deleteProduct } = useDeleteProduct();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>();

  const [searchValue, setSearchValue] = useState(name || "");

  useEffect(() => {
    setSearchValue(name || "");
  }, [name]);

  const updateUrl = (
    updates: Record<string, string | null>,
    resetPage = false,
  ) => {
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

    [searchParams, router],
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
            "Lỗi khi xóa sản phẩm. Sản phẩm có thể đã nằm trong đơn hàng.",
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

  const columns = [
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
            width={54}
            height={54}
            style={{
              objectFit: "cover",
              borderRadius: 8,
              border: "1px solid #eeeeee",
            }}
            fallback="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='54' height='54'%3E%3Crect width='100%25' height='100%25' fill='%23f5f5f5'/%3E%3C/svg%3E"
          />
        ) : (
          <div
            style={{
              width: 54,
              height: 54,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#f5f5f5",
              borderRadius: 8,
              color: "#bfbfbf",
              border: "1px solid #eeeeee",
            }}
          >
            <PictureOutlined style={{ fontSize: 22 }} />
          </div>
        );
      },
    },
    {
      title: "Tên",
      dataIndex: "name",
      key: "name",
      render: (value: string) => (
        <span style={{ color: "#262626", fontWeight: 500 }}>{value}</span>
      ),
    },
    {
      title: "Giá (đ)",
      dataIndex: "price",
      key: "price",
      align: "left" as const,
      render: (value: number) => (
        <span style={{ color: "#262626" }}>
          {value?.toLocaleString("vi-VN") ?? "—"}
        </span>
      ),
    },
    {
      title: "Tồn kho",
      dataIndex: "stock",
      key: "stock",
      width: 110,
      render: (value: number) => <span>{value ?? 0}</span>,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 140,
      render: (value: string) => {
        const isActive = value === "ACTIVE";

        return (
          <Tag
            className={
              isActive ? "product-status-active" : "product-status-inactive"
            }
          >
            {value || "UNKNOWN"}
          </Tag>
        );
      },
    },
    {
      title: "Thao tác",
      key: "action",
      width: 130,
      render: (_: unknown, record: Product) => (
        <Space separator={<span style={{ color: "#d9d9d9" }}>·</span>} size={5}>
          <Button
            type="link"
            className="product-action-link"
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
            <Button type="link" danger className="product-action-link">
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      {contextHolder}

      <div className="product-management">
        {/* Tiêu đề */}
        <Flex
          justify="space-between"
          align="center"
          gap={12}
          className="product-management-header"
        >
          <h2>Quản lí sản phẩm</h2>

          <Button
            type="primary"
            icon={<PlusOutlined />}
            className="product-add-button"
            onClick={() => {
              setEditingProduct(undefined);
              setIsModalOpen(true);
            }}
          >
            Thêm sản phẩm
          </Button>
        </Flex>

        {/* Tìm kiếm, lọc và sắp xếp */}
        <div className="product-filter-row">
          <Input
            placeholder="Tìm theo tên sản phẩm"
            value={searchValue}
            onChange={handleSearchChange}
            allowClear
            className="product-search-input"
          />

          <Select
            value={status}
            onChange={handleStatusChange}
            className="product-filter-select"
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
            className="product-filter-select product-sort-select"
            options={[
              { label: "Sắp xếp: Giá tăng", value: "price,asc" },
              { label: "Sắp xếp: Giá giảm", value: "price,desc" },
              { label: "Sắp xếp: Tên A-Z", value: "name,asc" },
              { label: "Sắp xếp: Tên Z-A", value: "name,desc" },
            ]}
          />
        </div>

        {/* Danh sách sản phẩm */}
        <Table<Product>
          className="product-management-table"
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
          scroll={{ x: 850 }}
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
