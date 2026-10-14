"use client";

import React, { useState, useEffect, Suspense } from "react";
import { Form, Input, Button, Typography, App, Card } from "antd";
import {
  UserOutlined,
  LockOutlined,
  MailOutlined,
  PhoneOutlined,
  GoogleOutlined,
  FacebookFilled,
  GithubFilled,
  LinkedinFilled,
  CheckCircleOutlined,
  ShoppingOutlined,
} from "@ant-design/icons";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import styles from "./SharedAuthCard.module.scss";

const { Title, Text, Paragraph } = Typography;

interface SharedAuthProps {
  initialSignUp?: boolean;
}

export function SharedAuthCard({ initialSignUp = false }: SharedAuthProps) {
  const { message: messageApi } = App.useApp();
  const [isSignUp, setIsSignUp] = useState(initialSignUp);
  const [loginLoading, setLoginLoading] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [isRegisterSuccess, setIsRegisterSuccess] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const [loginForm] = Form.useForm();
  const [registerForm] = Form.useForm();

  useEffect(() => {
    const emailParam = searchParams.get("email");
    if (emailParam) {
      loginForm.setFieldsValue({ email: emailParam });
    }
  }, [searchParams, loginForm]);

  // Xử lý Đăng nhập
  const onLoginFinish = async (values: any) => {
    setLoginLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        let errorMsg = data?.message || "Đăng nhập thất bại!";
        let errorCode = data?.data?.code || data?.code;

        try {
          const errData = data;
          if (errData?.data && Array.isArray(errData.data) && errData.data.length > 0) {
            errorMsg = errData.data[0].message;
          }
          if (errData.message) errorMsg = errData.message;
        } catch (e) { }

        if (
          res.status === 403 &&
          (errorCode === "ACCOUNT_UNVERIFIED" || errorMsg.includes("kích hoạt"))
        ) {
          throw new Error(
            "Tài khoản chưa được kích hoạt. Chúng tôi đã gửi lại liên kết kích hoạt mới vào email của bạn. Vui lòng kiểm tra hộp thư."
          );
        }

        throw new Error(errorMsg);
      }

      const token =
        data?.data?.accessToken || data?.accessToken || data?.token || "";
      const userRole = data?.data?.user?.role;

      localStorage.setItem("token", token);
      if (userRole) {
        localStorage.setItem("role", userRole);
      }

      messageApi.success("Đăng nhập thành công!");

      if (userRole === "ADMIN" || userRole === "PRODUCT_OWNER") {
        router.push("/admin");
      } else {
        router.push("/");
      }
    } catch (error: any) {
      messageApi.error(error.message);
    } finally {
      setLoginLoading(false);
    }
  };

  // Xử lý Đăng ký
  const onRegisterFinish = async (values: any) => {
    setRegisterLoading(true);
    try {
      const { confirm, ...requestData } = values;

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        let errorMsg = errData?.message || "Đăng ký thất bại";
        if (errData?.data && Array.isArray(errData.data) && errData.data.length > 0) {
          errorMsg = errData.data[0].message;
        }
        throw new Error(errorMsg);
      }

      setIsRegisterSuccess(true);
    } catch (error: any) {
      messageApi.error(error.message);
    } finally {
      setRegisterLoading(false);
    }
  };

  if (isRegisterSuccess) {
    return (
      <div className="auth-wrapper">
        <Card className={styles.successCard}>
          <div className={styles.successIcon}>
            <CheckCircleOutlined />
          </div>
          <Title level={3} className={styles.successTitle}>
            Đăng ký tài khoản thành công!
          </Title>
          <Text type="secondary" className={styles.successText}>
            Chúng tôi đã gửi một email kích hoạt tới địa chỉ hộp thư của bạn. Vui lòng kiểm tra hộp thư để kích hoạt tài khoản.
          </Text>
          <Button
            type="primary"
            size="large"
            onClick={() => {
              setIsRegisterSuccess(false);
              setIsSignUp(false);
              window.history.replaceState(null, "", "/auth/login");
            }}
            block
            className="action-btn"
          >
            Quay lại đăng nhập
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="auth-wrapper">
      <div className={`auth-container ${isSignUp ? "right-panel-active" : ""}`}>
        {/* Form Đăng ký (Sign Up) */}
        <div className="form-container sign-up-container">
          <Form
            form={registerForm}
            name="register"
            onFinish={onRegisterFinish}
            layout="vertical"
            size="large"
            className="auth-form"
          >
            <Title level={2} className="auth-title">
              Tạo tài khoản
            </Title>
            <div className="social-icons">
              <span className="social-btn"><GoogleOutlined /></span>
              <span className="social-btn"><FacebookFilled /></span>
              <span className="social-btn"><GithubFilled /></span>
              <span className="social-btn"><LinkedinFilled /></span>
            </div>
            <Text type="secondary" className="auth-subtitle">
              hoặc sử dụng email để đăng ký
            </Text>

            <Form.Item
              name="name"
              rules={[{ required: true, message: "Vui lòng nhập họ và tên!" }]}
              className={styles.formItemSmallGap}
            >
              <Input prefix={<UserOutlined />} placeholder="Họ và tên" className="custom-input" />
            </Form.Item>

            <Form.Item
              name="email"
              validateTrigger={["onChange", "onBlur"]}
              rules={[
                { required: true, message: "Vui lòng nhập Email!" },
                { type: "email", message: "Email không hợp lệ!" },
                { pattern: /@gmail\.com$/, message: "Email phải có đuôi @gmail.com" },
              ]}
              className={styles.formItemSmallGap}
            >
              <Input prefix={<MailOutlined />} placeholder="Email (@gmail.com)" className="custom-input" />
            </Form.Item>

            <Form.Item
              name="phone"
              validateTrigger={["onChange", "onBlur"]}
              normalize={(value) => (value ? value.replace(/\D/g, "") : "")}
              rules={[
                { required: true, message: "Vui lòng nhập số điện thoại!" },
                { pattern: /^0\d{9}$/, message: "SĐT bắt đầu bằng 0 và đủ 10 số" },
              ]}
              className={styles.formItemSmallGap}
            >
              <Input prefix={<PhoneOutlined />} placeholder="Số điện thoại" maxLength={10} className="custom-input" />
            </Form.Item>

            <Form.Item
              name="password"
              validateTrigger={["onChange", "onBlur"]}
              rules={[
                { required: true, message: "Vui lòng nhập mật khẩu!" },
                {
                  pattern: /^(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/,
                  message: "Mật khẩu ≥8 ký tự, có chữ hoa & ký tự đặc biệt",
                },
              ]}
              className={styles.formItemSmallGap}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="Mật khẩu" className="custom-input" />
            </Form.Item>

            <Form.Item
              name="confirm"
              dependencies={["password"]}
              rules={[
                { required: true, message: "Vui lòng xác nhận mật khẩu!" },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue("password") === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error("Hai mật khẩu không khớp nhau!"));
                  },
                }),
              ]}
              className={styles.formItemMediumGap}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="Xác nhận mật khẩu" className="custom-input" />
            </Form.Item>

            <Button
              type="primary"
              htmlType="submit"
              loading={registerLoading}
              className="action-btn"
            >
              ĐĂNG KÝ
            </Button>
          </Form>
        </div>

        {/* Form Đăng nhập (Sign In) */}
        <div className="form-container sign-in-container">
          <Form
            form={loginForm}
            name="login"
            onFinish={onLoginFinish}
            layout="vertical"
            size="large"
            className="auth-form"
          >
            <Title level={2} className="auth-title">
              Đăng nhập
            </Title>
            <div className="social-icons">
              <span className="social-btn"><GoogleOutlined /></span>
              <span className="social-btn"><FacebookFilled /></span>
              <span className="social-btn"><GithubFilled /></span>
              <span className="social-btn"><LinkedinFilled /></span>
            </div>
            <Text type="secondary" className="auth-subtitle">
              hoặc sử dụng tài khoản email của bạn
            </Text>

            <Form.Item
              name="email"
              rules={[
                { required: true, message: "Vui lòng nhập Email!" },
                { type: "email", message: "Email không hợp lệ!" },
              ]}
              className={styles.formItemEmailLogin}
            >
              <Input prefix={<MailOutlined />} placeholder="Địa chỉ Email" className="custom-input" />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[{ required: true, message: "Vui lòng nhập mật khẩu!" }]}
              className={styles.formItemPasswordLogin}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="Mật khẩu" className="custom-input" />
            </Form.Item>

            <div className={styles.forgotPasswordWrap}>
              <Link href="/auth/forgot-password" className="forgot-link">
                Quên mật khẩu?
              </Link>
            </div>

            <Button
              type="primary"
              htmlType="submit"
              loading={loginLoading}
              className="action-btn"
            >
              ĐĂNG NHẬP
            </Button>
          </Form>
        </div>

        {/* Tấm trượt Overlay có hiệu ứng trượt mượt mà & Logo nhấp nháy sáng tạo */}
        <div className="overlay-container">
          <div className="overlay">
            {/* Panel khi đang ở trạng thái Sign Up (nằm bên trái) */}
            <div className="overlay-panel overlay-left">
              <div className="creative-blink-logo">
                <div className="blink-icon-wrap">
                  <ShoppingOutlined />
                  <span className="blink-dot"></span>
                </div>
                <span className="blink-brand-name">
                  e<span className="blink-accent">Commerce</span>
                </span>
              </div>
              <div className="brand-motto">PREMIUM SHOPPING DESTINATION</div>

              <Title level={2} className={styles.overlayHeading}>
                Chào mừng trở lại!
              </Title>
              <Paragraph className={styles.overlayParagraph}>
                Kết nối lại với <strong>eCommerce</strong> để nhận ưu đãi đặc quyền và khám phá thế giới công nghệ đỉnh cao!
              </Paragraph>
              <button
                type="button"
                className="ghost-btn"
                onClick={() => {
                  setIsSignUp(false);
                  window.history.replaceState(null, "", "/auth/login");
                }}
              >
                ĐĂNG NHẬP
              </button>
            </div>

            {/* Panel khi đang ở trạng thái Sign In (nằm bên phải) */}
            <div className="overlay-panel overlay-right">
              <div className="creative-blink-logo">
                <div className="blink-icon-wrap">
                  <ShoppingOutlined />
                  <span className="blink-dot"></span>
                </div>
                <span className="blink-brand-name">
                  e<span className="blink-accent">Commerce</span>
                </span>
              </div>
              <div className="brand-motto">SMART • FAST • RELIABLE</div>

              <Title level={2} className={styles.overlayHeading}>
                Xin chào bạn!
              </Title>
              <Paragraph className={styles.overlayParagraph}>
                Chào mừng bạn đến với <strong>eCommerce</strong>. Đăng ký tài khoản ngay hôm nay để trải nghiệm mua sắm hiện đại &amp; giao hàng siêu tốc!
              </Paragraph>
              <button
                type="button"
                className="ghost-btn"
                onClick={() => {
                  setIsSignUp(true);
                  window.history.replaceState(null, "", "/auth/register");
                }}
              >
                ĐĂNG KÝ
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
