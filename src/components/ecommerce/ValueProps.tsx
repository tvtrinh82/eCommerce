"use client";

import React from "react";
import { Row, Col } from "antd";
import {
  RocketOutlined,
  SafetyCertificateOutlined,
  CustomerServiceOutlined,
  SyncOutlined,
} from "@ant-design/icons";
import { MOCK_VALUE_PROPOSITIONS } from "@/lib/mockData";
import styles from "./ValueProps.module.scss";

export default function ValueProps() {
  const getIcon = (key: string) => {
    switch (key) {
      case "shipping":
        return <RocketOutlined className={styles.icon} />;
      case "warranty":
        return <SafetyCertificateOutlined className={styles.icon} />;
      case "support":
        return <CustomerServiceOutlined className={styles.icon} />;
      case "returns":
        return <SyncOutlined className={styles.icon} />;
      default:
        return <RocketOutlined className={styles.icon} />;
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.cardContainer}>
        <Row gutter={[20, 20]}>
          {MOCK_VALUE_PROPOSITIONS.map((item) => (
            <Col xs={12} sm={12} md={6} key={item.key}>
              <div className={styles.propItem}>
                <div className={styles.iconCircle}>{getIcon(item.key)}</div>
                <div className={styles.textWrap}>
                  <h4 className={styles.title}>{item.title}</h4>
                  <p className={styles.subtitle}>{item.subtitle}</p>
                </div>
              </div>
            </Col>
          ))}
        </Row>
      </div>
    </div>
  );
}
