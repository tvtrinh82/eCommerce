"use client";

import React, { useState, useEffect } from "react";
import { Layout, Dropdown, message, ConfigProvider, theme } from "antd";
import {
  LayoutDashboard,
  Package,
  Users,
  UserCheck,
  ShoppingCart,
  BarChart,
  Mail,
  FileText,
  CheckSquare,
  LogOut,
  Search,
  Bell,
  ChevronDown,
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import styles from "./AdminLayout.module.scss";

import { adminThemeConfig } from "@/config/theme";

const { Sider } = Layout;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  const pathname = usePathname();
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    localStorage.removeItem("admin_theme");
    document.documentElement.classList.remove("dark");
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = (localStorage.getItem("role") || "").toUpperCase();

    if (!token) {
      messageApi.warning("Vui lòng đăng nhập với quyền quản trị viên");
      router.push("/auth/login");
      return;
    }

    if (role && role !== "ADMIN" && role !== "PRODUCT_OWNER") {
      messageApi.error("Bạn không có quyền truy cập trang quản trị");
      router.push("/");
      return;
    }

    try {
      const cachedUser = localStorage.getItem("user");
      if (cachedUser) setUser(JSON.parse(cachedUser));
    } catch {}

    const fetchUser = async () => {
      try {
        const res = await fetch("/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          const userData = data.data || data;
          setUser(userData);
          localStorage.setItem("user", JSON.stringify(userData));

          const userRole = (userData?.role || userData?.roles?.[0]?.name || userData?.roles?.[0] || "").toUpperCase();
          if (userRole && userRole !== "ADMIN" && userRole !== "PRODUCT_OWNER") {
            messageApi.error("Bạn không có quyền truy cập trang quản trị");
            router.push("/");
          }
        }
      } catch {}
    };
    fetchUser();
  }, [router, messageApi]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    messageApi.success("Đã đăng xuất thành công");
    router.push("/auth/login");
  };

  const menuItems = [
    { key: "/admin", label: "Tổng quan", icon: LayoutDashboard },
    { key: "/admin/products", label: "Sản phẩm", icon: Package },
    { key: "/admin/customers", label: "Khách hàng", icon: Users },
    { key: "/admin/employees", label: "Nhân viên", icon: UserCheck },
    { key: "/admin/orders", label: "Đơn hàng", icon: ShoppingCart },
    { key: "/admin/tickets", label: "Duyệt đơn (PO)", icon: CheckSquare },
    { key: "/admin/dashboard", label: "Bảng điều khiển", icon: BarChart },
    { key: "/admin/emails", label: "Mail lỗi", icon: Mail, badge: 20 },
    { key: "/admin/reports", label: "Báo cáo", icon: FileText },
  ];

  const displayName =
    user?.fullName || user?.name || user?.username || user?.email?.split("@")[0] || "Quản trị viên";
  const displayRole = user?.role || user?.roles?.[0] || "Admin";
  const avatarLetter = displayName.charAt(0).toUpperCase();

  return (
    <ConfigProvider
      theme={adminThemeConfig}
    >
      <div className={`${styles.layoutRoot} ${styles.lightTheme} light-theme`}>
        {contextHolder}

        <div className={styles.mainContainer}>
          {/* Sidebar */}
          <Sider width={360} className={styles.sidebar}>
            <div className={styles.sidebarInner}>
              <div>
                <div className={styles.logoWrapper} onClick={() => router.push("/admin")}>
                  <div className={styles.logoIcon}>
                    <div className={styles.logoGrid}>
                      <span className={styles.logoDot}></span>
                      <span className={styles.logoDot}></span>
                      <span className={styles.logoDot}></span>
                      <span className={styles.logoDot}></span>
                    </div>
                  </div>
                  <span className={styles.logoText}>eCommerce</span>
                </div>

                <div className={styles.navMenu}>
                  {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.key;
                    return (
                      <button
                        key={item.key}
                        onClick={() => router.push(item.key)}
                        className={`${styles.navItem} ${isActive ? styles.active : ""}`}
                      >
                        <div className={styles.navItemLeft}>
                          <Icon size={30} strokeWidth={isActive ? 2.5 : 2} />
                          <span>{item.label}</span>
                        </div>
                        {item.badge && <span className={styles.badge}>{item.badge}</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className={styles.logoutBottom}>
                <button onClick={handleLogout} className={styles.btnLogout}>
                  <LogOut size={30} />
                  <span>Đăng xuất</span>
                </button>
              </div>
            </div>
          </Sider>

          {/* Right Header & Content */}
          <div className={styles.contentWrapper}>
            <div className={styles.header}>
              <div />

              <div className={styles.headerRight}>
                <div className={styles.bellBtn}>
                  <Bell size={30} />
                </div>

                <Dropdown
                  getPopupContainer={(trigger) => trigger.parentElement || document.body}
                  menu={{
                    items: [
                      {
                        key: "user-info",
                        label: (
                          <div className={styles.userDropdownItem}>
                            <div className={styles.userDropdownName}>{displayName}</div>
                            <div className={styles.userDropdownEmail}>{user?.email || "admin@example.com"}</div>
                          </div>
                        ),
                      },
                      { type: "divider" },
                      {
                        key: "logout",
                        icon: <LogOut size={24} />,
                        label: "Đăng xuất",
                        danger: true,
                        onClick: handleLogout,
                      },
                    ],
                  }}
                  trigger={["click"]}
                >
                  <div className={styles.userTrigger}>
                    {user?.avatar ? (
                      <img src={user.avatar} alt={displayName} className={styles.avatarImage} />
                    ) : (
                      <div className={styles.avatarLetter}>{avatarLetter}</div>
                    )}
                    <div className={styles.userMeta}>
                      <div className={styles.userName}>{displayName}</div>
                      <div className={styles.userRole}>{displayRole}</div>
                    </div>
                    <ChevronDown size={24} />
                  </div>
                </Dropdown>
              </div>
            </div>

            <div className={styles.mainContent}>{children}</div>
          </div>
        </div>
      </div>
    </ConfigProvider>
  );
}