"use client";

import React from "react";
import { Row, Col, Button } from "antd";
import { ArrowRightOutlined, FireFilled } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import styles from "./PromoBanner.module.scss";

export default function PromoBanner() {
  const router = useRouter();

  return (
    <div className={styles.wrapper}>
      <div className={styles.bannerContainer}>
        <div className={styles.contentCol}>
          <div className={styles.tagWrap}>
            <span className={styles.tagBadge}>
              <FireFilled style={{ marginRight: 6, color: "#ff4d4f" }} />
              ƯU ĐÃI CÓ HẠN
            </span>
          </div>

          <h2 className={styles.title}>
            Giảm tới 30% cho các dòng điện thoại cao cấp
          </h2>
          <p className={styles.subtitle}>
            Nâng cấp lên khung viền Titan sang trọng, nhiếp ảnh thuật toán AI đỉnh cao và tốc độ 5G siêu nhanh với mức giá không thể tốt hơn.
          </p>

          <div className={styles.countdownRow}>
            <div className={styles.timerBox}>
              <span className={styles.timeVal}>02</span>
              <span className={styles.timeUnit}>Ngày</span>
            </div>
            <span className={styles.colon}>:</span>
            <div className={styles.timerBox}>
              <span className={styles.timeVal}>14</span>
              <span className={styles.timeUnit}>Giờ</span>
            </div>
            <span className={styles.colon}>:</span>
            <div className={styles.timerBox}>
              <span className={styles.timeVal}>45</span>
              <span className={styles.timeUnit}>Phút</span>
            </div>
            <span className={styles.colon}>:</span>
            <div className={styles.timerBox}>
              <span className={styles.timeVal}>30</span>
              <span className={styles.timeUnit}>Giây</span>
            </div>
          </div>

          <Button
            type="primary"
            size="large"
            className={styles.ctaBtn}
            icon={<ArrowRightOutlined />}
            iconPosition="end"
            onClick={() => router.push("/#deals")}
          >
            Xem ưu đãi ngay
          </Button>
        </div>

        <div className={styles.imageCol}>
          <div className={styles.collageWrapper}>
            <img
              src="https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=600&q=80"
              alt="Promo phone 1"
              className={styles.phone1}
            />
            <img
              src="https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=600&q=80"
              alt="Promo phone 2"
              className={styles.phone2}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
