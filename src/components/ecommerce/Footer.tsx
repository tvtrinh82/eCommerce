"use client";

import React from "react";
import Link from "next/link";
import { Row, Col } from "antd";
import {
  MobileOutlined,
  GithubOutlined,
  TwitterOutlined,
  LinkedinOutlined,
  YoutubeOutlined,
} from "@ant-design/icons";
import styles from "./Footer.module.scss";

export default function Footer() {
  return (
    <footer className={styles.footer} id="about">
      <div className={styles.container}>
        <Row gutter={[40, 40]}>
          <Col xs={24} sm={24} md={8} lg={8}>
            <div className={styles.brandCol}>
              <Link href="/" className={styles.logo}>
                <div className={styles.logoIcon}>
                  <MobileOutlined />
                </div>
                <div className={styles.logoText}>
                  e<span className={styles.highlight}>Commerce</span>
                </div>
              </Link>
              <p className={styles.brandDesc}>
                Hệ thống bán lẻ điện thoại hàng đầu, cung cấp các sản phẩm chính hãng, công nghệ đỉnh cao với dịch vụ hậu mãi và bảo hành toàn quốc.
              </p>
              <div className={styles.socialIcons}>
                <a href="#" className={styles.socialBtn} title="Twitter">
                  <TwitterOutlined />
                </a>
                <a href="#" className={styles.socialBtn} title="LinkedIn">
                  <LinkedinOutlined />
                </a>
                <a href="#" className={styles.socialBtn} title="YouTube">
                  <YoutubeOutlined />
                </a>
                <a href="#" className={styles.socialBtn} title="GitHub">
                  <GithubOutlined />
                </a>
              </div>
            </div>
          </Col>

          <Col xs={12} sm={8} md={5} lg={5}>
            <h4 className={styles.columnTitle}>Khám phá & Mua sắm</h4>
            <ul className={styles.linkList}>
              <li><Link href="/#popular">Điện thoại nổi bật</Link></li>
              <li><Link href="/#deals">Ưu đãi giảm giá</Link></li>
              <li><Link href="/#brands">Thương hiệu chính hãng</Link></li>
              <li><Link href="/cart">Giỏ hàng</Link></li>
              <li><Link href="/track-order">Tra cứu đơn hàng</Link></li>
            </ul>
          </Col>

          <Col xs={12} sm={8} md={5} lg={5}>
            <h4 className={styles.columnTitle}>Danh mục sản phẩm</h4>
            <ul className={styles.linkList}>
              <li><Link href="/#brands">Apple iPhone</Link></li>
              <li><Link href="/#brands">Samsung Galaxy</Link></li>
              <li><Link href="/#brands">Google Pixel</Link></li>
              <li><Link href="/#brands">OnePlus Flagship</Link></li>
              <li><Link href="/#brands">Tai nghe & Phụ kiện</Link></li>
            </ul>
          </Col>

          <Col xs={24} sm={8} md={6} lg={6}>
            <h4 className={styles.columnTitle}>Hỗ trợ khách hàng</h4>
            <ul className={styles.linkList}>
              <li><a href="#">Trung tâm trợ giúp & FAQ</a></li>
              <li><a href="#">Chính sách giao hàng & vận chuyển</a></li>
              <li><a href="#">Đổi trả & hoàn tiền 30 ngày</a></li>
              <li><a href="#">Trung tâm bảo hành ủy quyền</a></li>
              <li><a href="#">Email hỗ trợ: hotro@ecommerce.vn</a></li>
            </ul>
          </Col>
        </Row>

        <div className={styles.bottomBar}>
          <div className={styles.copyright}>
            © {new Date().getFullYear()} eCommerce Inc. Bảo lưu mọi quyền. Nền tảng thương mại điện tử công nghệ cao.
          </div>

          <div className={styles.paymentBadges}>
            <span className={styles.payBadge}>VNPay</span>
            <span className={styles.payBadge}>Momo</span>
            <span className={styles.payBadge}>VISA</span>
            <span className={styles.payBadge}>Mastercard</span>
            <span className={styles.payBadge}>COD</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
