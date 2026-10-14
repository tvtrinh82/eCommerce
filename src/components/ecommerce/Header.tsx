"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Input,
  Badge,
  Button,
  Dropdown,
  Avatar,
  Drawer,
  MenuProps,
} from "antd";
import {
  SearchOutlined,
  ShoppingCartOutlined,
  HeartOutlined,
  UserOutlined,
  MenuOutlined,
  MobileOutlined,
  RightOutlined,
  FireOutlined,
  SafetyCertificateOutlined,
} from "@ant-design/icons";
import { useCartStore } from "@/store/cartStore";
import styles from "./Header.module.scss";

export default function Header() {
  const router = useRouter();
  const { cart, setCartVisible } = useCartStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [wishlistCount] = useState(4);

  const cartTotalItems = cart.reduce((acc, item) => acc + item.quantity, 0);

  const navLinks = [
    { label: "Trang chủ", href: "/" },
    { label: "Sản phẩm", href: "/#popular" },
    { label: "Thương hiệu", href: "/#brands" },
    { label: "Khuyến mãi", href: "/#deals" },
    { label: "Giới thiệu", href: "/#about" },
  ];

  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);

  React.useEffect(() => {
    const storedToken = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const storedRole = typeof window !== "undefined" ? localStorage.getItem("role") : null;
    setToken(storedToken);

    if (storedToken) {
      try {
        const cachedUser = localStorage.getItem("user");
        if (cachedUser) {
          setUser(JSON.parse(cachedUser));
        }
      } catch {}

      fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${storedToken}` },
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data) {
            const userData = data.data || data;
            setUser(userData);
            try {
              localStorage.setItem("user", JSON.stringify(userData));
              if (userData.role) {
                localStorage.setItem("role", userData.role);
              }
            } catch {}
          }
        })
        .catch(() => {});
    } else {
      setUser(null);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
    router.push("/auth/login");
  };

  const currentRole = (
    user?.role ||
    user?.roles?.[0]?.name ||
    user?.roles?.[0] ||
    (typeof window !== "undefined" ? localStorage.getItem("role") : "") ||
    ""
  ).toUpperCase();

  const isAdminRole = currentRole === "ADMIN" || currentRole === "PRODUCT_OWNER";
  const isLoggedIn = !!token;

  const userMenuItems: MenuProps["items"] = [
    ...(isLoggedIn
      ? [
          {
            key: "profile",
            label: user?.fullName || user?.name || user?.username || "Tài khoản của tôi",
            icon: <UserOutlined />,
            onClick: () => router.push("/profile"),
          },
          {
            key: "orders",
            label: "Đơn mua của tôi",
            icon: <MobileOutlined />,
            onClick: () => router.push("/orders/history"),
          },
          {
            key: "track",
            label: "Tra cứu đơn hàng",
            icon: <SafetyCertificateOutlined />,
            onClick: () => router.push("/track-order"),
          },
        ]
      : [
          {
            key: "track",
            label: "Tra cứu đơn hàng",
            icon: <SafetyCertificateOutlined />,
            onClick: () => router.push("/track-order"),
          },
        ]),
    ...(isAdminRole
      ? [
          {
            key: "admin",
            label: "Trang quản trị (Admin)",
            icon: <SafetyCertificateOutlined />,
            onClick: () => router.push("/admin"),
          },
        ]
      : []),
    {
      type: "divider" as const,
    },
    isLoggedIn
      ? {
          key: "logout",
          label: "Đăng xuất",
          danger: true,
          onClick: handleLogout,
        }
      : {
          key: "login",
          label: "Đăng nhập / Đăng ký",
          onClick: () => router.push("/auth/login"),
        },
  ];

  return (
    <header className={styles.header}>
      {/* Top Banner Notice */}
      <div className={styles.topNotice}>
        <div className={styles.noticeContainer}>
          <span>
            <FireOutlined style={{ marginRight: 6, color: "#FFD666" }} />
            Khuyến mãi đặc biệt: Giảm đến 30% cho smartphone flagship + Miễn phí giao hàng hỏa tốc
          </span>
          <div className={styles.noticeRight}>
            <Link href="/track-order">Tra cứu đơn hàng</Link>
            <span className={styles.divider}>•</span>
            <Link href="/help">Trung tâm trợ giúp</Link>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className={styles.mainNav}>
        <div className={styles.navContainer}>
          {/* Logo */}
          <Link href="/" className={styles.logo}>
            <div className={styles.logoIcon}>
              <MobileOutlined />
            </div>
            <div className={styles.logoText}>
              e<span className={styles.highlight}>Commerce</span>
            </div>
          </Link>

          {/* Desktop Links */}
          <nav className={styles.desktopNav}>
            {navLinks.map((link) => (
              <Link key={link.label} href={link.href} className={styles.navLink}>
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Search Bar Input */}
          <div className={styles.searchWrapper}>
            <Input
              prefix={<SearchOutlined style={{ color: "#8C8C8C", fontSize: 16 }} />}
              placeholder="Tìm kiếm điện thoại, cấu hình, hãng sản xuất..."
              className={styles.searchInput}
              onPressEnter={(e) => {
                const val = (e.target as HTMLInputElement).value;
                if (val) router.push(`/?search=${encodeURIComponent(val)}`);
              }}
            />
          </div>

          {/* Actions: Wishlist, Cart, Profile */}
          <div className={styles.navActions}>
            {/* Wishlist */}
            <button
              className={styles.actionBtn}
              title="Yêu thích"
              onClick={() => router.push("/wishlist")}
            >
              <Badge count={wishlistCount} overflowCount={99} size="small" color="#1677FF">
                <HeartOutlined className={styles.actionIcon} />
              </Badge>
            </button>

            {/* Cart with Drawer Trigger (Chỉ hiển thị khi đã đăng nhập) */}
            {isLoggedIn && (
              <button
                className={styles.actionBtn}
                title="Giỏ hàng"
                onClick={() => setCartVisible(true)}
              >
                <Badge count={cartTotalItems} overflowCount={99} size="small" color="#1677FF">
                  <ShoppingCartOutlined className={styles.actionIcon} />
                </Badge>
              </button>
            )}

            {/* User Profile */}
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" arrow>
              <div className={styles.profileBtn}>
                <Avatar
                  size={36}
                  style={{ backgroundColor: "#E6F4FF", color: "#1677FF", fontWeight: 700 }}
                  icon={<UserOutlined />}
                />
              </div>
            </Dropdown>

            {/* Mobile Hamburger */}
            <Button
              className={styles.mobileMenuToggle}
              icon={<MenuOutlined />}
              onClick={() => setMobileMenuOpen(true)}
            />
          </div>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      <Drawer
        title={
          <div className={styles.logo}>
            <div className={styles.logoIcon}>
              <MobileOutlined />
            </div>
            <div className={styles.logoText}>
              Tech<span className={styles.highlight}>Nova</span>
            </div>
          </div>
        }
        placement="left"
        onClose={() => setMobileMenuOpen(false)}
        open={mobileMenuOpen}
        styles={{ body: { padding: 0 } }}
      >
        <div className={styles.mobileDrawerContent}>
          <div style={{ padding: "16px 20px" }}>
            <Input
              prefix={<SearchOutlined />}
              placeholder="Tìm kiếm điện thoại..."
              onPressEnter={(e) => {
                const val = (e.target as HTMLInputElement).value;
                setMobileMenuOpen(false);
                if (val) router.push(`/?search=${encodeURIComponent(val)}`);
              }}
            />
          </div>

          <div className={styles.mobileNavLinks}>
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className={styles.mobileNavLink}
                onClick={() => setMobileMenuOpen(false)}
              >
                <span>{link.label}</span>
                <RightOutlined style={{ fontSize: 12, color: "#BFBFBF" }} />
              </Link>
            ))}
          </div>

          <div className={styles.mobileBottomActions}>
            {isLoggedIn && (
              <Button
                type="primary"
                block
                size="large"
                onClick={() => {
                  setMobileMenuOpen(false);
                  router.push("/cart");
                }}
              >
                Xem giỏ hàng ({cartTotalItems})
              </Button>
            )}
            <Button
              block
              size="large"
              style={{ marginTop: isLoggedIn ? 12 : 0 }}
              onClick={() => {
                setMobileMenuOpen(false);
                router.push("/track-order");
              }}
            >
              Tra cứu đơn hàng
            </Button>
          </div>
        </div>
      </Drawer>
    </header>
  );
}
