"use client";

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from 'antd';
import {
  RightOutlined,
  ThunderboltOutlined,
  SafetyCertificateOutlined,
  CustomerServiceOutlined,
  CarOutlined,
} from '@ant-design/icons';
import ClientLayout from '@/components/shared/ClientLayout';
import { ProductCard } from '@/components/shared/ProductCard/ProductCard';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton/LoadingSkeleton';
import { EmptyState } from '@/components/shared/EmptyState/EmptyState';
import { useProducts } from '@/features/products/hooks';
import type { PageResponse, Product } from '@/features/products/types';
import styles from './home.module.scss';

interface HomeClientProps {
  initialProducts: PageResponse<Product> | null;
}


export default function HomeClient({ initialProducts }: HomeClientProps) {
  const router = useRouter();

  // Dùng initialData từ server — React Query dùng ngay, không fetch lại cho đến khi stale
  const { data: pageData, isLoading, isError } = useProducts(
    { page: 0, size: 12, sort: 'id,desc' },
    initialProducts ?? undefined
  );

  const products = pageData?.content || [];

  return (
    <ClientLayout>
      <div className={styles.container}>
        {/* 1. HERO SECTION */}
        <section className={styles.hero}>
          <div className={styles.heroInner}>
            <div className={styles.heroContent}>
              <div className={styles.heroBadge}>
                <ThunderboltOutlined /> Công nghệ tiên phong &amp; Chất lượng hàng đầu
              </div>
              <h1 className={styles.heroTitle}>
                Trải Nghiệm Mua Sắm <span>Đẳng Cấp &amp; Nhanh Chóng</span>
              </h1>
              <p className={styles.heroDesc}>
                Khám phá bộ sưu tập thiết bị công nghệ chính hãng mới nhất với ưu đãi độc quyền và dịch vụ chăm sóc khách hàng tận tâm.
              </p>
              <div className={styles.heroActions}>
                <Button
                  className={styles.heroPrimaryBtn}
                  onClick={() => router.push('/products')}
                >
                  Mua sắm ngay
                </Button>
                <Button
                  className={styles.heroSecondaryBtn}
                  onClick={() => {
                    const el = document.getElementById('featured-products');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  Khám phá sản phẩm
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* 2. VALUE PROPOSITIONS */}
        <section className={styles.featuresSection}>
          <div className={styles.featuresGrid}>
            <div className={styles.featureItem}>
              <div className={styles.featureIcon}>
                <SafetyCertificateOutlined />
              </div>
              <div className={styles.featureText}>
                <h4>100% Chính Hãng</h4>
                <p>Nguồn gốc xuất xứ rõ ràng</p>
              </div>
            </div>

            <div className={styles.featureItem}>
              <div className={styles.featureIcon}>
                <CarOutlined />
              </div>
              <div className={styles.featureText}>
                <h4>Giao Hàng Tận Nơi</h4>
                <p>Nhanh chóng và an toàn</p>
              </div>
            </div>

            <div className={styles.featureItem}>
              <div className={styles.featureIcon}>
                <ThunderboltOutlined />
              </div>
              <div className={styles.featureText}>
                <h4>Xử Lý Thần Tốc</h4>
                <p>Đơn hàng được duyệt tức thì</p>
              </div>
            </div>

            <div className={styles.featureItem}>
              <div className={styles.featureIcon}>
                <CustomerServiceOutlined />
              </div>
              <div className={styles.featureText}>
                <h4>Hỗ Trợ 24/7</h4>
                <p>Đội ngũ chuyên nghiệp</p>
              </div>
            </div>
          </div>
        </section>

        {/* 3. FEATURED PRODUCTS (Real BE Data) */}
        <section className={styles.productsSection} id="featured-products">
          <div className={styles.sectionHeader}>
            <div>
              <h2 className={styles.sectionTitle}>Sản Phẩm Nổi Bật</h2>
              <p className={styles.sectionSubtitle}>
                Các sản phẩm công nghệ đang được quan tâm nhất hôm nay
              </p>
            </div>
            <Link href="/products" className={styles.viewAllLink}>
              Xem tất cả <RightOutlined />
            </Link>
          </div>

          {isLoading ? (
            <LoadingSkeleton count={8} />
          ) : isError ? (
            <EmptyState
              title="Không thể tải sản phẩm"
              description="Đã xảy ra lỗi khi kết nối tới máy chủ. Vui lòng thử lại sau."
              actionText="Thử lại"
              onAction={() => window.location.reload()}
            />
          ) : products.length === 0 ? (
            <EmptyState
              title="Chưa có sản phẩm nào"
              description="Hệ thống đang cập nhật danh sách sản phẩm mới."
            />
          ) : (
            <>
              <div className={styles.productGrid}>
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              <div className={styles.bottomAction}>
                <Button
                  type="primary"
                  className={styles.moreBtn}
                  onClick={() => router.push('/products')}
                >
                  Xem tất cả sản phẩm
                </Button>
              </div>
            </>
          )}
        </section>
      </div>
    </ClientLayout>
  );
}
