"use client";

import React, { useState, useEffect } from "react";
import { Row, Col, Typography, Input, Select, Button, Spin } from "antd";
import {
  FireOutlined,
  ThunderboltOutlined,
  FilterOutlined,
  AppstoreOutlined,
} from "@ant-design/icons";
import { useSearchParams } from "next/navigation";
import Header from "@/components/ecommerce/Header";
import HeroCarousel from "@/components/ecommerce/HeroCarousel";
import ValueProps from "@/components/ecommerce/ValueProps";
import ProductCard from "@/components/ecommerce/ProductCard";
import PromoBanner from "@/components/ecommerce/PromoBanner";
import BrandGrid from "@/components/ecommerce/BrandGrid";
import Newsletter from "@/components/ecommerce/Newsletter";
import Footer from "@/components/ecommerce/Footer";
import CartDrawer from "@/components/ecommerce/CartDrawer";
import { MOCK_POPULAR_PRODUCTS, MOCK_BEST_DEALS } from "@/lib/mockData";
import { apiClient } from "@/lib/api-client";
import { Product } from "@/types";
import styles from "./Home.module.scss";

const { Title, Text } = Typography;

export default function ECommerceHomePage() {
  const searchParams = useSearchParams();
  const search = searchParams?.get("search") || "";

  const [products, setProducts] = useState<Product[]>(MOCK_POPULAR_PRODUCTS);
  const [bestDeals, setBestDeals] = useState<Product[]>(MOCK_BEST_DEALS);
  const [selectedBrand, setSelectedBrand] = useState<string>("All");
  const [sortBy, setSortBy] = useState<string>("featured");
  const [isLoadingApi, setIsLoadingApi] = useState<boolean>(false);

  // Tải danh sách sản phẩm thực tế từ Backend API (bao gồm sản phẩm do PO thêm vào)
  useEffect(() => {
    const fetchApiProducts = async () => {
      try {
        setIsLoadingApi(true);
        const res: any = await apiClient.get("/products?page=0&size=100&status=ACTIVE");
        const list = res.data?.content || res.data || [];
        if (Array.isArray(list) && list.length > 0) {
          const mapped: Product[] = list.map((item: any) => ({
            id: item.id,
            name: item.name,
            brand: item.brand || "Chính Hãng",
            model: item.category || "Tiêu chuẩn",
            tag: item.stock > 0 ? "Mới lên kệ" : "Hết hàng",
            specs: item.specs || (item.stock !== undefined ? `Kho còn ${item.stock} sản phẩm` : ""),
            price: Number(item.price || 0),
            oldPrice: item.oldPrice ? Number(item.oldPrice) : Math.round(Number(item.price || 0) * 1.1),
            discountPercent: item.oldPrice ? Math.round((1 - item.price / item.oldPrice) * 100) : 10,
            rating: 5.0,
            reviewsCount: 1,
            imageUrl: item.imageUrl || item.image || item.image_url || "https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=600&q=80",
            inStock: (item.stock ?? 0) > 0,
            stockCount: item.stock ?? 0,
          }));

          // Đưa sản phẩm API (do PO thêm vào) lên đầu danh sách
          setProducts(mapped);
          setBestDeals(mapped.slice(0, 4));
        }
      } catch (err) {
        console.warn("Không thể tải sản phẩm từ backend API, sử dụng mockData làm fallback:", err);
      } finally {
        setIsLoadingApi(false);
      }
    };

    fetchApiProducts();
  }, []);

  // Filter & sort products based on search or brand
  const filteredProducts = products
    .filter((p) => {
      const matchesSearch =
        !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.brand.toLowerCase().includes(search.toLowerCase()) ||
        p.specs.toLowerCase().includes(search.toLowerCase());
      const matchesBrand = selectedBrand === "All" || p.brand === selectedBrand;
      return matchesSearch && matchesBrand;
    })
    .sort((a, b) => {
      if (sortBy === "price-asc") return a.price - b.price;
      if (sortBy === "price-desc") return b.price - a.price;
      if (sortBy === "rating") return b.rating - a.rating;
      return 0;
    });

  return (
    <div className={styles.pageRoot}>
      {/* 1. Header with Search, Wishlist, Cart & Profile */}
      <Header />

      {/* Cart Drawer */}
      <CartDrawer />

      {/* Main Content */}
      <main className={styles.main}>
        {!search && (
          <>
            {/* 2. Hero Banner Carousel */}
            <HeroCarousel />

            {/* 3. Value Proposition Bar */}
            <ValueProps />
          </>
        )}

        {/* 4. Popular Smartphones Section */}
        <section className={styles.section} id="popular">
          <div className={styles.container}>
            <div className={styles.sectionHeader}>
              <div>
                <span className={styles.subHeading}>
                  <FireOutlined style={{ marginRight: 6, color: "#ff4d4f" }} />
                  XU HƯỚNG CÔNG NGHỆ MỚI NHẤT
                </span>
                <h2 className={styles.heading}>
                  {search ? `Kết quả tìm kiếm cho "${search}"` : "Điện thoại thông minh phổ biến"}
                </h2>
              </div>

              {/* Filters & Sorting */}
              <div className={styles.filterActions}>
                <div className={styles.brandPills}>
                  {["Tất cả", "Apple", "Samsung", "Google", "OnePlus"].map((brand) => {
                    const actualBrand = brand === "Tất cả" ? "All" : brand;
                    return (
                      <button
                        key={brand}
                        className={`${styles.pillBtn} ${
                          selectedBrand === actualBrand ? styles.pillActive : ""
                        }`}
                        onClick={() => setSelectedBrand(actualBrand)}
                      >
                        {brand}
                      </button>
                    );
                  })}
                </div>

                <Select
                  value={sortBy}
                  onChange={(val) => setSortBy(val)}
                  className={styles.sortSelect}
                  options={[
                    { value: "featured", label: "Nổi bật nhất" },
                    { value: "price-asc", label: "Giá: Thấp đến Cao" },
                    { value: "price-desc", label: "Giá: Cao đến Thấp" },
                    { value: "rating", label: "Đánh giá cao nhất" },
                  ]}
                />
              </div>
            </div>

            {/* Products Grid: 4 columns on PC, responsive down to 1-2 on mobile */}
            <Row gutter={[20, 24]}>
              {filteredProducts.map((product) => (
                <Col xs={24} sm={12} md={8} lg={6} key={product.id}>
                  <ProductCard product={product} />
                </Col>
              ))}
            </Row>

            {filteredProducts.length === 0 && (
              <div className={styles.emptyResults}>
                <Text type="secondary">
                  Không tìm thấy điện thoại nào phù hợp với từ khóa của bạn. Hãy thử tìm kiếm "iPhone", "Samsung", hoặc "Xiaomi".
                </Text>
              </div>
            )}
          </div>
        </section>

        {!search && (
          <>
            {/* 5. Limited Time Promotional Banner */}
            <PromoBanner />

            {/* 6. Shop by Brand */}
            <BrandGrid />

            {/* 7. Best Deals Grid */}
            <section className={styles.section} id="deals">
              <div className={styles.container}>
                <div className={styles.sectionHeader}>
                  <div>
                    <span className={styles.subHeading}>
                      <ThunderboltOutlined style={{ marginRight: 6, color: "#faad14" }} />
                      ƯU ĐÃI SỐ LƯỢNG CÓ HẠN
                    </span>
                    <h2 className={styles.heading}>Điện thoại Giảm giá Sốc</h2>
                  </div>
                  <span className={styles.headerSubtitle}>
                    Tiết kiệm tới 30% khi áp dụng phiếu giảm giá trực tiếp tại bước thanh toán.
                  </span>
                </div>

                <Row gutter={[20, 24]}>
                  {bestDeals.map((product) => (
                    <Col xs={24} sm={12} md={8} lg={6} key={product.id}>
                      <ProductCard product={product} badgeType="discount" />
                    </Col>
                  ))}
                </Row>
              </div>
            </section>

            {/* 8. Newsletter Subscription */}
            <Newsletter />
          </>
        )}
      </main>

      {/* 9. Footer */}
      <Footer />
    </div>
  );
}
