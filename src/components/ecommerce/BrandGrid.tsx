"use client";

import React from "react";
import { Row, Col } from "antd";
import { ArrowRightOutlined } from "@ant-design/icons";
import { MOCK_BRANDS } from "@/lib/mockData";
import styles from "./BrandGrid.module.scss";

export default function BrandGrid() {
  return (
    <div className={styles.wrapper} id="brands">
      <div className={styles.sectionHeader}>
        <div>
          <span className={styles.subHeading}>THƯƠNG HIỆU HÀNG ĐẦU</span>
          <h2 className={styles.heading}>Mua sắm theo Thương hiệu Chính hãng</h2>
        </div>
        <p className={styles.headerDesc}>
          100% sản phẩm chính hãng với bảo hành toàn quốc và hỗ trợ dịch vụ ủy quyền.
        </p>
      </div>

      <Row gutter={[16, 16]}>
        {MOCK_BRANDS.map((b) => (
          <Col xs={12} sm={8} md={4} key={b.name}>
            <div className={styles.brandCard}>
              <div className={styles.logoWrap}>
                <span className={styles.brandNameTitle}>{b.name}</span>
              </div>
              <span className={styles.modelsCount}>{b.count}</span>
              <div className={styles.exploreLink}>
                <span>Xem ngay</span>
                <ArrowRightOutlined style={{ fontSize: 11 }} />
              </div>
            </div>
          </Col>
        ))}
      </Row>
    </div>
  );
}
