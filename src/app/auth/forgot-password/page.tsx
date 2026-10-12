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
        <div className="form-container" style={{ left: 0, width: "50%", zIndex: 2 }}>
          <div className="auth-form">
            {sent ? (
              <div style={{ textAlign: "center", width: "100%", padding: "0 10px" }}>
                <div style={{ fontSize: 52, color: "#16a34a", marginBottom: 14 }}>
                  <CheckCircleOutlined />
                </div>
                <Title level={2} className="auth-title">Kiểm tra hộp thư</Title>
                <Text type="secondary" className="auth-subtitle" style={{ display: "block", marginBottom: 24 }}>
                  Chúng tôi đã gửi đường dẫn đặt lại mật khẩu đến email của bạn. Vui lòng kiểm tra hộp thư đến hoặc mục thư rác.
                </Text>
                <Button
                  type="primary"
                  className="action-btn"
                  onClick={() => router.push("/auth/login")}
                  style={{ width: "100%" }}
                >
                  QUAY LẠI ĐĂNG NHẬP
                </Button>
              </div>
            ) : (
              <div style={{ width: "100%" }}>
                <Title level={2} className="auth-title">
                  Quên mật khẩu?
                </Title>
                <Text type="secondary" className="auth-subtitle" style={{ display: "block", marginBottom: 22 }}>
                  Nhập email tài khoản của bạn để nhận liên kết khôi phục mật khẩu
                </Text>

                <Form name="forgot-password" onFinish={onFinish} layout="vertical" size="large">
                  <Form.Item
                    name="email"
                    rules={[
                      { required: true, message: "Vui lòng nhập Email!" },
                      { type: "email", message: "Email không hợp lệ!" },
                    ]}
                    style={{ marginBottom: 20 }}
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
                    className="action-btn"
                    style={{ width: "100%", marginBottom: 18 }}
                  >
                    GỬI LIÊN KẾT XÁC NHẬN
                  </Button>
                </Form>

                <div style={{ textAlign: "center" }}>
                  <Link href="/auth/login" className="forgot-link" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontWeight: 500 }}>
                    <ArrowLeftOutlined /> Quay lại đăng nhập
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* NỬA PHẢI: TẤM OVERLAY ĐỒNG BỘ VỚI LOGO NHẤP NHÁY ECOMMERCE */}
        <div className="overlay-container">
          <div className="overlay" style={{ left: 0, width: "100%" }}>
            <div className="overlay-panel overlay-right" style={{ width: "100%" }}>
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

              <Title level={2} style={{ color: "#ffffff", marginBottom: 10, marginTop: 4 }}>
                Bảo mật tài khoản
              </Title>
              <Paragraph style={{ color: "#d1d5db", fontSize: 13.5, maxWidth: 290, textAlign: "center", lineHeight: 1.6 }}>
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
