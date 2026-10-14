"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Result, Button, Card, Descriptions, Divider, Space } from "antd";
import {
  CheckCircleFilled,
  RocketOutlined,
  ShoppingOutlined,
  DownloadOutlined,
  HomeOutlined,
} from "@ant-design/icons";
import Header from "@/components/ecommerce/Header";
import Footer from "@/components/ecommerce/Footer";
import styles from "./OrderSuccess.module.scss";

export default function OrderSuccessPage() {
  const router = useRouter();
  const orderNumber = "EC-89472910";
  const orderDate = new Date().toLocaleDateString("vi-VN", {
    month: "numeric",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className={styles.pageRoot}>
      <Header />

      <main className={styles.main}>
        <div className={styles.container}>
          <div className={styles.successCard}>
            <div className={styles.iconCircle}>
              <CheckCircleFilled className={styles.checkIcon} />
            </div>

            <span className={styles.badge}>THANH TOÁN THÀNH CÔNG</span>
            <h1 className={styles.title}>Cảm Ơn Bạn Đã Đặt Hàng!</h1>
            <p className={styles.subtitle}>
              Chúng tôi đã nhận được đơn hàng của bạn và đội ngũ kho vận đang tiến hành đóng gói để vận chuyển trong thời gian sớm nhất.
            </p>

            <div className={styles.orderNumberBox}>
              <span className={styles.label}>Mã đơn hàng:</span>
              <span className={styles.code}>{orderNumber}</span>
            </div>

            <div className={styles.detailsBox}>
              <Descriptions
                bordered
                column={{ xs: 1, sm: 2, md: 3 }}
                size="small"
                className={styles.descTable}
              >
                <Descriptions.Item label="Ngày đặt hàng">{orderDate}</Descriptions.Item>
                <Descriptions.Item label="Phương thức thanh toán">
                  <span className={styles.statusPaid}>Thanh toán online (VNPay)</span>
                </Descriptions.Item>
                <Descriptions.Item label="Dự kiến giao hàng">
                  <span className={styles.deliveryDate}>1 - 3 Ngày làm việc</span>
                </Descriptions.Item>
                <Descriptions.Item label="Đơn vị vận chuyển">Giao Hàng Hỏa Tốc</Descriptions.Item>
                <Descriptions.Item label="Khu vực nhận hàng">Hà Nội / TP. Hồ Chí Minh</Descriptions.Item>
                <Descriptions.Item label="Tổng tiền đã thanh toán">34.990.000 đ</Descriptions.Item>
              </Descriptions>
            </div>

            <div className={styles.actionButtons}>
              <Button
                type="primary"
                size="large"
                icon={<RocketOutlined />}
                className={styles.trackBtn}
                onClick={() => router.push("/track-order")}
              >
                Theo dõi hành trình đơn hàng
              </Button>

              <Button
                size="large"
                icon={<HomeOutlined />}
                className={styles.homeBtn}
                onClick={() => router.push("/")}
              >
                Tiếp tục mua sắm
              </Button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
