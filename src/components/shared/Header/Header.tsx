"use client";

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Input, Badge, Button, Dropdown, Avatar, Drawer } from 'antd';
import {
  ShoppingOutlined,
  ShoppingCartOutlined,
  SearchOutlined,
  UserOutlined,
  LogoutOutlined,
  OrderedListOutlined,
  MenuOutlined,
} from '@ant-design/icons';
import debounce from 'lodash/debounce';
import { useCurrentUser, useLogout } from '@/features/auth/hooks';
import { useCart } from '@/features/cart/hooks';
import { useUIStore } from '@/stores/uiStore';
import { getUserDisplayName } from '@/lib/format';
import styles from './Header.module.scss';

export function Header() {

  const pathname = usePathname();
  const router = useRouter();
  const { openAuthModal } = useUIStore();
  const [isScrolled, setIsScrolled] = useState(false);

  const { data: user } = useCurrentUser();
  const { data: cart } = useCart();
  const logoutMutation = useLogout();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const updateScrollState = () => setIsScrolled(window.scrollY > 24);

    updateScrollState();
    window.addEventListener('scroll', updateScrollState, { passive: true });
    return () => window.removeEventListener('scroll', updateScrollState);
  }, []);

  // Debounced search navigation
  const debouncedNavigate = useMemo(
    () =>
      debounce((keyword: string) => {
        if (keyword.trim()) {
          router.push(`/products?search=${encodeURIComponent(keyword.trim())}`);
        }
      }, 500),
    [router]
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchTerm(val);
    debouncedNavigate(val);
  };

  const handleSearchEnter = () => {
    if (searchTerm.trim()) {
      debouncedNavigate.cancel();
      router.push(`/products?search=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  const displayName = getUserDisplayName(user);

  const userMenuItems = [
    {
      key: 'user-info',
      label: (
        <div>
          <strong>{displayName}</strong>
          <div style={{ fontSize: 12, color: '#6b7280' }}>{user?.email}</div>
        </div>
      ),
      disabled: true,
    },
    { type: 'divider' as const },
    {
      key: 'orders',
      icon: <OrderedListOutlined />,
      label: 'Đơn hàng của tôi',
      onClick: () => router.push('/orders'),
    },
    {
      key: 'cart',
      icon: <ShoppingCartOutlined />,
      label: 'Giỏ hàng',
      onClick: () => router.push('/cart'),
    },
    { type: 'divider' as const },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Đăng xuất',
      danger: true,
      onClick: () => logoutMutation.mutate(),
    },
  ];

  const totalCartItems = user ? (cart?.items ? cart.items.length : 0) : 0;

  return (
    <header className={`${styles.header} ${isScrolled ? styles.scrolled : ''}`}>
      <div className={styles.inner}>
        {/* Brand Logo */}
        <Link href="/" className={styles.logo}>
          <img src="/logo.png" alt="E-Commerce Logo" className={styles.logoImg} />
          E-<span>Commerce</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className={styles.nav}>
          <Link
            href="/"
            className={`${styles.navLink} ${pathname === '/' ? styles.active : ''}`}
          >
            Trang chủ
          </Link>
          <Link
            href="/products"
            className={`${styles.navLink} ${pathname.startsWith('/products') ? styles.active : ''}`}
          >
            Sản phẩm
          </Link>
          <Link
            href="/orders"
            className={`${styles.navLink} ${pathname.startsWith('/orders') ? styles.active : ''}`}
          >
            Đơn hàng
          </Link>
        </nav>

        {/* Search Bar */}
        <div className={styles.searchWrap}>
          <Input
            className={styles.searchInput}
            placeholder="Tìm kiếm sản phẩm, thương hiệu..."
            prefix={<SearchOutlined />}
            value={searchTerm}
            onChange={handleSearchChange}
            onPressEnter={handleSearchEnter}
            allowClear
          />
        </div>

        {/* Action Buttons */}
        <div className={styles.actions}>
          {/* Cart Icon */}
          <Link href="/cart" className={styles.cartBtn} id="header-cart-icon">
            <Badge count={totalCartItems} size="small" offset={[2, -2]}>
              <ShoppingCartOutlined />
            </Badge>
          </Link>

          {/* User Account / Login Button */}
          {user ? (
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" trigger={['click']}>
              <div className={styles.userBtn}>
                <Avatar size={28} className={styles.avatar}>
                  {displayName.charAt(0).toUpperCase()}
                </Avatar>
                <span className={styles.userName}>{displayName}</span>
              </div>
            </Dropdown>
          ) : (
            <Button
              type="primary"
              className={styles.loginBtn}
              onClick={() => openAuthModal('login')}
            >
              Đăng nhập
            </Button>
          )}

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            className={styles.mobileMenuBtn}
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Mở menu"
          >
            <MenuOutlined />
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <Drawer
        title="Menu điều hướng"
        placement="left"
        onClose={() => setMobileMenuOpen(false)}
        open={mobileMenuOpen}
      >
        <Input
          placeholder="Tìm kiếm sản phẩm..."
          prefix={<SearchOutlined />}
          value={searchTerm}
          onChange={handleSearchChange}
          onPressEnter={() => {
            handleSearchEnter();
            setMobileMenuOpen(false);
          }}
          allowClear
        />

        <div className={styles.mobileDrawerNav}>
          <Link
            href="/"
            className={`${styles.mobileNavLink} ${pathname === '/' ? styles.active : ''}`}
            onClick={() => setMobileMenuOpen(false)}
          >
            Trang chủ
          </Link>
          <Link
            href="/products"
            className={`${styles.mobileNavLink} ${pathname.startsWith('/products') ? styles.active : ''}`}
            onClick={() => setMobileMenuOpen(false)}
          >
            Sản phẩm
          </Link>
          <Link
            href="/orders"
            className={`${styles.mobileNavLink} ${pathname.startsWith('/orders') ? styles.active : ''}`}
            onClick={() => setMobileMenuOpen(false)}
          >
            Đơn hàng của tôi
          </Link>
          <Link
            href="/cart"
            className={`${styles.mobileNavLink} ${pathname.startsWith('/cart') ? styles.active : ''}`}
            onClick={() => setMobileMenuOpen(false)}
          >
            Giỏ hàng {totalCartItems > 0 ? `(${totalCartItems})` : ''}
          </Link>
        </div>

        <div className={styles.mobileDrawerFooter}>
          {user ? (
            <div className={styles.mobileUserBox}>
              <div className={styles.mobileUserInfo}>
                <Avatar size="small" className={styles.avatar}>
                  {displayName.charAt(0).toUpperCase()}
                </Avatar>
                <div>
                  <div className={styles.mobileUserName}>{displayName}</div>
                  <div className={styles.mobileUserEmail}>{user.email}</div>
                </div>
              </div>
              <Button
                danger
                icon={<LogoutOutlined />}
                block
                style={{ marginTop: 12, height: 38, borderRadius: 6, fontWeight: 600 }}
                onClick={() => {
                  setMobileMenuOpen(false);
                  logoutMutation.mutate();
                }}
              >
                Đăng xuất
              </Button>
            </div>
          ) : (
            <Button
              type="primary"
              block
              style={{ height: 38, borderRadius: 6, fontWeight: 600 }}
              onClick={() => {
                setMobileMenuOpen(false);
                openAuthModal('login');
              }}
            >
              Đăng nhập / Đăng ký
            </Button>
          )}
        </div>
      </Drawer>
    </header>
  );
}
