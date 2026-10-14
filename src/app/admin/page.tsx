"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Spin, Alert } from "antd";
import {
  DollarSign,
  Package,
  ShoppingCart,
  Clock,
  MoreVertical,
} from "lucide-react";
import { dashboardApi } from "@/features/dashboard/api";
import styles from "./Dashboard.module.scss";

export default function Dashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"Daily" | "Weekly" | "Monthly">("Monthly");

  const [stats, setStats] = useState({
    revenueToday: 0,
    totalProducts: 0,
    totalStock: 0,
    totalOrders: 0,
    pendingOrders: 0,
  });

  const [salesBars, setSalesBars] = useState<Array<{ label: string; count: number; revenue: number }>>([]);
  const [distribution, setDistribution] = useState({
    completedRate: 64,
    pendingRate: 24,
    cancelledRate: 12,
    totalOrders: 0,
  });
  const [transactions, setTransactions] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);

  const loadDashboardData = async () => {
    try {
      setError(null);
      const [summaryData, chartData, distData, transData, custData] = await Promise.all([
        dashboardApi.getSummaryStats(),
        dashboardApi.getOverallSalesChart(activeTab),
        dashboardApi.getOrderDistribution(),
        dashboardApi.getLatestTransactions(4),
        dashboardApi.getRecentCustomers(4),
      ]);

      setStats(summaryData);
      setSalesBars(chartData);
      setDistribution(distData);
      setTransactions(transData);
      setCustomers(custData);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Không thể tải dữ liệu bảng điều khiển.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [activeTab]);

  const maxRevenue = Math.max(...salesBars.map((b) => b.revenue), 1);
  const maxCount = Math.max(...salesBars.map((b) => b.count), 1);

  if (loading) {
    return (
      <div className={styles.loadingCenter}>
        <Spin size="large" />
      </div>
    );
  }

  const donutGradient = `conic-gradient(#2563eb 0% ${distribution.completedRate}%, #38bdf8 ${distribution.completedRate}% ${distribution.completedRate + distribution.pendingRate}%, #ef4444 ${distribution.completedRate + distribution.pendingRate}% 100%)`;

  return (
    <div className={styles.container}>
      {/* HEADER ĐIỀU HƯỚNG */}
      <div className={styles.headerBar}>
        <div>
          <h2 className={styles.headerTitle}>Tổng quan bán hàng</h2>
          <span className={styles.headerSubtitle}>Thống kê dữ liệu thực tế từ cơ sở dữ liệu</span>
        </div>

        <div>
          <button
            type="button"
            onClick={() => router.push("/admin/orders")}
            className={styles.btnPrimaryAction}
          >
            Quản lý đơn hàng
          </button>
        </div>
      </div>

      {error && <Alert message="Lỗi tải dữ liệu" description={error} type="error" showIcon />}

      {/* 1. HÀNG 4 THẺ THỐNG KÊ (ĐÃ GẮN SỰ KIỆN CLICK ĐIỀU HƯỚNG) */}
      <div className={styles.statsGrid}>
        {/* Thẻ 1: Doanh thu hôm nay */}
        <div className={styles.cardHero}>
          <div className={styles.cardHeroIcon}>
            <DollarSign size={24} color="#ffffff" />
          </div>
          <div>
            <div className={styles.cardHeroValue}>
              {stats.revenueToday.toLocaleString("vi-VN")} đ
            </div>
            <div className={styles.cardHeroLabel}>Doanh thu hôm nay</div>
          </div>
        </div>

        {/* Thẻ 2: Tồn kho -> Chuyển đến trang Sản phẩm */}
        <div
          className={styles.statCard}
          onClick={() => router.push("/admin/products")}
          role="button"
          tabIndex={0}
        >
          <div className={styles.iconPurple}>
            <Package size={22} />
          </div>
          <div>
            <div className={styles.statValue}>
              {stats.totalStock.toLocaleString("vi-VN")}
            </div>
            <div className={styles.statLabel}>Tồn kho ({stats.totalProducts} SP)</div>
          </div>
        </div>

        {/* Thẻ 3: Tổng đơn hàng -> Chuyển đến trang Đơn hàng */}
        <div
          className={styles.statCard}
          onClick={() => router.push("/admin/orders")}
          role="button"
          tabIndex={0}
        >
          <div className={styles.iconAmber}>
            <ShoppingCart size={22} />
          </div>
          <div>
            <div className={styles.statValue}>
              {stats.totalOrders.toLocaleString("vi-VN")}
            </div>
            <div className={styles.statLabel}>Tổng đơn hàng</div>
          </div>
        </div>

        {/* Thẻ 4: Đơn chờ xử lý -> Chuyển đến tab PENDING của trang Đơn hàng */}
        <div
          className={styles.statCard}
          onClick={() => router.push("/admin/orders?status=PENDING")}
          role="button"
          tabIndex={0}
        >
          <div className={styles.iconBlue}>
            <Clock size={22} />
          </div>
          <div>
            <div className={styles.statValue}>{stats.pendingOrders}</div>
            <div className={styles.statLabel}>Đơn chờ xử lý</div>
          </div>
        </div>
      </div>

      {/* 2. CỤM BIỂU ĐỒ DOANH SỐ VÀ PHÂN BỔ */}
      <div className={styles.twoColsGrid}>
        <div className={styles.sectionCard}>
          <div className={styles.cardHeader}>
            <div>
              <div className={styles.sectionTitle}>Biểu đồ bán hàng</div>
              <div className={styles.bigCounter}>
                <span className={styles.counterLabel}>Tổng đơn:</span>
                {stats.totalOrders}
              </div>
            </div>

            <div className={styles.filterWrapper}>
              <div className={styles.filterPill}>
                {(["Daily", "Weekly", "Monthly"] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`${styles.pillBtn} ${activeTab === tab ? styles.pillActive : ""}`}
                  >
                    {tab === "Daily" ? "Ngày" : tab === "Weekly" ? "Tuần" : "Tháng"}
                  </button>
                ))}
              </div>
              <MoreVertical size={16} />
            </div>
          </div>

          <div className={styles.legendRow}>
            <div className={styles.legendItem}>
              <span className={styles.dotBlue}></span>
              <span>Doanh thu</span>
            </div>
            <div className={styles.legendItem}>
              <span className={styles.dotSky}></span>
              <span>Số lượng đơn</span>
            </div>
          </div>

          <div className={styles.chartBarsWrapper}>
            {salesBars.map((item) => {
              const revPercent = Math.max(Math.round((item.revenue / maxRevenue) * 100), 6);
              const countPercent = Math.max(Math.round((item.count / maxCount) * 100), 6);

              return (
                <div key={item.label} className={styles.barCol}>
                  <div
                    className={styles.barGroup}
                    style={{ "--bar-rev": `${revPercent}%`, "--bar-count": `${countPercent}%` } as React.CSSProperties}
                    title={`Doanh thu: ${item.revenue.toLocaleString("vi-VN")} đ\nSố đơn: ${item.count}`}
                  >
                    <div className={styles.barReach}></div>
                    <div className={styles.barEngage}></div>
                  </div>
                  <span className={styles.monthLabel}>{item.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className={styles.sectionCard}>
          <div className={styles.cardHeaderCenter}>
            <span className={styles.sectionTitle}>Tỷ lệ hoàn thành</span>
            <MoreVertical size={16} />
          </div>

          <div className={styles.donutContainer}>
            <div className={styles.donutWheel} style={{ "--donut-bg": donutGradient } as React.CSSProperties}>
              <div className={styles.donutCenter}>
                <span className={styles.donutPercentage}>{distribution.completedRate}%</span>
                <span className={styles.donutSubtext}>Thành công</span>
              </div>
            </div>
          </div>

          <div className={styles.legendRow}>
            <div className={styles.legendItem}>
              <span className={styles.dotBlue}></span>
              <span>Thành công</span>
            </div>
            <div className={styles.legendItem}>
              <span className={styles.dotSky}></span>
              <span>Đang chờ</span>
            </div>
            <div className={styles.legendItem}>
              <span className={styles.dotRed}></span>
              <span>Hủy</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. CỤM BẢNG DƯỚI */}
      <div className={styles.twoColsGrid}>
        <div className={styles.sectionCard}>
          <div className={styles.cardHeaderCenter}>
            <span className={styles.sectionTitle}>Giao dịch gần đây</span>
            <span onClick={() => router.push("/admin/orders")} className={styles.linkViewAll}>
              Xem tất cả →
            </span>
          </div>

          <div className={styles.tableResponsive}>
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  <th>Mã đơn</th>
                  <th>Sản phẩm</th>
                  <th>Ngày đặt</th>
                  <th>Đơn giá</th>
                  <th>SL</th>
                  <th>Tổng tiền</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className={styles.emptyData}>
                      Chưa có đơn hàng nào
                    </td>
                  </tr>
                ) : (
                  transactions.map((t) => (
                    <tr key={t.id} onClick={() => router.push(`/admin/orders`)}>
                      <td className={styles.tableCode}>{t.id}</td>
                      <td className={styles.tableProductName}>{t.productName}</td>
                      <td className={styles.tableDate}>{t.date}</td>
                      <td>{t.price}</td>
                      <td className={styles.tableQty}>{t.quantity}</td>
                      <td className={styles.tableTotal}>{t.totalAmount}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className={styles.sectionCard}>
          <div className={styles.cardHeaderCenter}>
            <span className={styles.sectionTitle}>Khách hàng mới</span>
            <span onClick={() => router.push("/admin/customers")} className={styles.linkViewAll}>
              Xem tất cả →
            </span>
          </div>

          <div className={styles.customerList}>
            {customers.length === 0 ? (
              <div className={styles.emptyData}>Chưa có dữ liệu khách hàng</div>
            ) : (
              customers.map((c) => (
                <div key={c.code} className={styles.customerRow}>
                  <div className={styles.customerInfo}>
                    <div className={styles.customerAvatar}>
                      {c.name ? c.name.charAt(0).toUpperCase() : "U"}
                    </div>
                    <div>
                      <div className={styles.customerName}>{c.name}</div>
                      <div className={styles.customerTime}>{c.time}</div>
                    </div>
                  </div>
                  <span className={styles.customerCode}>{c.code}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}