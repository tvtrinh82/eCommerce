"use client";

import React, { useState } from "react";
import { Input, Button, message } from "antd";
import { MailOutlined, SendOutlined, CheckCircleFilled } from "@ant-design/icons";
import styles from "./Newsletter.module.scss";

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = () => {
    if (!email || !email.includes("@")) {
      message.error("Vui lòng nhập địa chỉ email hợp lệ!");
      return;
    }
    setSubscribed(true);
    message.success("Cảm ơn bạn đã đăng ký nhận tin từ eCommerce!");
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.container}>
        <div className={styles.glowBg} />

        <div className={styles.content}>
          <div className={styles.iconWrap}>
            <MailOutlined className={styles.mailIcon} />
          </div>

          <div className={styles.textContent}>
            <span className={styles.badge}>BẢN TIN ECOMMERCE</span>
            <h2 className={styles.title}>Đăng Ký Nhận Tin & Giảm Ngay 10%</h2>
            <p className={styles.subtitle}>
              Trở thành người đầu tiên biết về các siêu phẩm flagship mới ra mắt, đợt giảm giá chớp nhoáng và ưu đãi độc quyền.
            </p>
          </div>

          <div className={styles.formWrap}>
            {subscribed ? (
              <div className={styles.successMsg}>
                <CheckCircleFilled style={{ color: "#52c41a", fontSize: 20 }} />
                <span>Bạn đã gia nhập danh sách VIP! Vui lòng kiểm tra hộp thư để nhận mã giảm giá 10%.</span>
              </div>
            ) : (
              <div className={styles.inputGroup}>
                <Input
                  size="large"
                  placeholder="Nhập địa chỉ email của bạn..."
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onPressEnter={handleSubscribe}
                  prefix={<MailOutlined style={{ color: "#8c8c8c" }} />}
                  className={styles.emailInput}
                />
                <Button
                  type="primary"
                  size="large"
                  icon={<SendOutlined />}
                  onClick={handleSubscribe}
                  className={styles.btnSubmit}
                >
                  Đăng ký
                </Button>
              </div>
            )}
            <span className={styles.privacyNote}>
              Chúng tôi tôn trọng quyền riêng tư của bạn. Có thể hủy đăng ký bất kỳ lúc nào chỉ với một cú nhấp chuột.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
