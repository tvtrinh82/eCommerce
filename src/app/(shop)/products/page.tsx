"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Input, Select, Pagination } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import ClientLayout from '@/components/shared/ClientLayout';
import { ProductCard } from '@/components/shared/ProductCard/ProductCard';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton/LoadingSkeleton';
import { EmptyState } from '@/components/shared/EmptyState/EmptyState';
import { useProducts } from '@/features/products/hooks';
import styles from './products.module.scss';

function ProductsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchParam = searchParams.get('search') || '';

  const [keyword, setKeyword] = useState(searchParam);
  const [page, setPage] = useState(0);
  const [size] = useState(12);
  const [sort, setSort] = useState('id,desc');

  // Sync keyword when searchParam changes
  useEffect(() => {
    setKeyword(searchParam);
    setPage(0);
  }, [searchParam]);

  const { data: pageData, isLoading, isError, refetch } = useProducts({
    page,
    size,
    keyword: keyword ? keyword : undefined,
    sort,
  });

  const products = pageData?.content || [];
  const totalElements = pageData?.totalElements || 0;

  const handleSearch = (val: string) => {
    setKeyword(val);
    setPage(0);
    const newQuery = val ? `?search=${encodeURIComponent(val)}` : '';
    router.push(`/products${newQuery}`);
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Tất Cả Sản Phẩm</h1>
        <p className={styles.subtitle}>
          {keyword ? `Kết quả tìm kiếm cho "${keyword}"` : 'Danh mục các sản phẩm công nghệ chính hãng'}
        </p>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.searchBox}>
          <Input.Search
            placeholder="Tìm theo tên sản phẩm..."
            allowClear
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onSearch={handleSearch}
            enterButton={<SearchOutlined />}
          />
        </div>

        <div className={styles.sortBox}>
          <span className={styles.sortLabel}>Sắp xếp theo:</span>
          <Select
            value={sort}
            onChange={(val) => {
              setSort(val);
              setPage(0);
            }}
            options={[
              { value: 'id,desc', label: 'Mới nhất' },
              { value: 'price,asc', label: 'Giá: Thấp đến cao' },
              { value: 'price,desc', label: 'Giá: Cao đến thấp' },
              { value: 'name,asc', label: 'Tên: A-Z' },
            ]}
            style={{ width: 170 }}
          />
        </div>
      </div>

      {isLoading ? (
        <LoadingSkeleton count={8} />
      ) : isError ? (
        <EmptyState
          title="Không thể tải sản phẩm"
          description="Đã xảy ra lỗi khi lấy danh sách sản phẩm từ hệ thống."
          actionText="Thử lại"
          onAction={() => refetch()}
        />
      ) : products.length === 0 ? (
        <EmptyState
          title="Không tìm thấy sản phẩm"
          description={keyword ? `Không có kết quả phù hợp cho "${keyword}".` : 'Chưa có sản phẩm nào trong danh mục.'}
          actionText={keyword ? 'Xóa bộ lọc' : undefined}
          onAction={() => handleSearch('')}
        />
      ) : (
        <>
          <div className={styles.grid}>
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {totalElements > size && (
            <div className={styles.paginationWrap}>
              <Pagination
                current={page + 1}
                pageSize={size}
                total={totalElements}
                onChange={(p) => setPage(p - 1)}
                showSizeChanger={false}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function ProductsPage() {
  return (
    <ClientLayout>
      <Suspense fallback={<div style={{ padding: 40 }}><LoadingSkeleton count={8} /></div>}>
        <ProductsContent />
      </Suspense>
    </ClientLayout>
  );
}
