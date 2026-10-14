"use client";

import React, { useState } from "react";
import { Form, Input, Button, Typography, message, Card } from "antd";
import {
  MailOutlined,
  ShoppingOutlined,
  ArrowLeftOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import Link from "next/link";
import { useRouter } from "next/navigation";

import styles from "./ForgotPassword.module.scss";

const { Title, Text, Paragraph } = Typography;

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const router = useRouter();

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      // Giả lập gửi liên kết đặt lại mật khẩu
      await new Promise((resolve) => setTimeout(resolve, 1200));
      setSent(true);
      message.success("Đã gửi hướng dẫn khôi phục mật khẩu vào email của bạn!");
    } catch (error: any) {
      message.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-container">
        {/* NỬA TRÁI: FORM QUÊN MẬT KHẨU */}
        <div className={`form-container ${styles.formContainerLeft}`}>
          <div className="auth-form">
            {sent ? (
              <div className={styles.successWrap}>
                <div className={styles.successIcon}>
                  <CheckCircleOutlined />
                </div>
                <Title level={2} className="auth-title">Kiểm tra hộp thư</Title>
                <Text type="secondary" className={`auth-subtitle ${styles.successDesc}`}>
                  Chúng tôi đã gửi đường dẫn đặt lại mật khẩu đến email của bạn. Vui lòng kiểm tra hộp thư đến hoặc mục thư rác.
                </Text>
                <Button
                  type="primary"
                  className={`action-btn ${styles.btnFull}`}
                  onClick={() => router.push("/auth/login")}
                >
                  QUAY LẠI ĐĂNG NHẬP
                </Button>
              </div>
            ) : (
              <div className={styles.formWrap}>
                <Title level={2} className="auth-title">
                  Quên mật khẩu?
                </Title>
                <Text type="secondary" className={`auth-subtitle ${styles.subtitle}`}>
                  Nhập email tài khoản của bạn để nhận liên kết khôi phục mật khẩu
                </Text>

                <Form name="forgot-password" onFinish={onFinish} layout="vertical" size="large">
                  <Form.Item
                    name="email"
                    rules={[
                      { required: true, message: "Vui lòng nhập Email!" },
                      { type: "email", message: "Email không hợp lệ!" },
                    ]}
                    className={styles.formItem}
                  >
                    <Input
                      prefix={<MailOutlined />}
                      placeholder="Địa chỉ Email của bạn"
                      className="custom-input"
                    />
                  </Form.Item>

                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    className={`action-btn ${styles.submitBtn}`}
                  >
                    GỬI LIÊN KẾT XÁC NHẬN
                  </Button>
                </Form>

                <div className={styles.bottomLinkWrap}>
                  <Link href="/auth/login" className={`forgot-link ${styles.backLoginLink}`}>
                    <ArrowLeftOutlined /> Quay lại đăng nhập
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* NỬA PHẢI: TẤM OVERLAY ĐỒNG BỘ VỚI LOGO NHẤP NHÁY ECOMMERCE */}
        <div className="overlay-container">
          <div className={`overlay ${styles.overlayFull}`}>
            <div className={`overlay-panel overlay-right ${styles.overlayPanelFull}`}>
              <div className="creative-blink-logo">
                <div className="blink-icon-wrap">
                  <ShoppingOutlined />
                  <span className="blink-dot"></span>
                </div>
                <span className="blink-brand-name">
                  e<span className="blink-accent">Commerce</span>
                </span>
              </div>
              <div className="brand-motto">SECURE • PROTECTED • TRUSTED</div>

              <Title level={2} className={styles.overlayTitle}>
                Bảo mật tài khoản
              </Title>
              <Paragraph className={styles.overlayDesc}>
                Hệ thống bảo mật <strong>eCommerce</strong> sẽ giúp bạn khôi phục quyền truy cập nhanh chóng và an toàn tuyệt đối.
              </Paragraph>
              
              <button
                type="button"
                className="ghost-btn"
                onClick={() => router.push("/auth/login")}
              >
                ĐĂNG NHẬP
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
