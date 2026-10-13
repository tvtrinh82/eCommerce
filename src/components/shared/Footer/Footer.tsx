"use client";

import React from 'react';
import Link from 'next/link';
import { ShoppingOutlined } from '@ant-design/icons';
import styles from './Footer.module.scss';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.grid}>
          {/* Brand Info */}
          <div className={styles.brandCol}>
            <Link href="/" className={styles.logo}>
              <img src="/logo.png" alt="E-Commerce Logo" className={styles.logoImg} />
              E-<span>Commerce</span>
            </Link>
            <p className={styles.desc}>
              Nền tảng thương mại điện tử hiện đại, mang đến trải nghiệm mua sắm nhanh chóng, tiện lợi và uy tín.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className={styles.colTitle}>Điều hướng</h4>
            <ul className={styles.linkList}>
              <li>
                <Link href="/">Trang chủ</Link>
              </li>
              <li>
                <Link href="/products">Sản phẩm</Link>
              </li>
              <li>
                <Link href="/orders">Đơn hàng của tôi</Link>
              </li>
              <li>
                <Link href="/cart">Giỏ hàng</Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className={styles.colTitle}>Hỗ trợ</h4>
            <ul className={styles.linkList}>
              <li>
                <Link href="/orders">Kiểm tra đơn hàng</Link>
              </li>
              <li>
                <Link href="/products">Tìm kiếm sản phẩm</Link>
              </li>
              <li>
                <Link href="#">Hướng dẫn mua hàng</Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className={styles.colTitle}>Liên hệ</h4>
            <p className={styles.contactText}>
              <strong>Hệ thống:</strong> E-Commerce Order Management
            </p>
            <p className={styles.contactText}>
              <strong>Dịch vụ:</strong> Trực tuyến 24/7
            </p>
          </div>
        </div>

        <div className={styles.bottom}>
          <p className={styles.copyright}>
            © {currentYear} E-Commerce System. All rights reserved.
          </p>
          <div className={styles.badges}>
            Designed with Next.js & Ant Design
          </div>
        </div>
      </div>
    </footer>
  );
}
