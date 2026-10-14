"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Steps,
  Form,
  Input,
  Button,
  Row,
  Col,
  Radio,
  Divider,
  message,
} from "antd";
import {
  EnvironmentOutlined,
  CreditCardOutlined,
  CheckCircleOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined,
  LockOutlined,
  SafetyCertificateOutlined,
} from "@ant-design/icons";
import Header from "@/components/ecommerce/Header";
import Footer from "@/components/ecommerce/Footer";
import { useCartStore } from "@/store/cartStore";
import styles from "./Checkout.module.scss";

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, clearCart } = useCartStore();
  const [form] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const shipping = 0; // Miễn phí vận chuyển
  const total = subtotal + shipping;

  const handleNextStep = async () => {
    try {
      if (currentStep === 0) {
        await form.validateFields(["fullName", "phone", "email", "address", "city"]);
        setCurrentStep(1);
      } else if (currentStep === 1) {
        setIsSubmitting(true);
        setTimeout(() => {
          setIsSubmitting(false);
          clearCart();
          router.push("/order-success");
        }, 1200);
      }
    } catch (error) {
      message.error("Vui lòng điền đầy đủ và chính xác các trường bắt buộc!");
    }
  };

  return (
    <div className={styles.pageRoot}>
      <Header />

      <main className={styles.main}>
        <div className={styles.container}>
          <div className={styles.topNav}>
            <button
              className={styles.backBtn}
              onClick={() => {
                if (currentStep > 0) setCurrentStep(currentStep - 1);
                else router.push("/cart");
              }}
            >
              <ArrowLeftOutlined />
              <span>{currentStep === 0 ? "Quay lại giỏ hàng" : "Quay lại bước trước"}</span>
            </button>
            <h1 className={styles.title}>Thanh Toán An Toàn</h1>
          </div>

          <div className={styles.stepsWrap}>
            <Steps
              current={currentStep}
              className={styles.steps}
              items={[
                {
                  title: "Địa chỉ giao hàng",
                  icon: <EnvironmentOutlined />,
                },
                {
                  title: "Phương thức thanh toán",
                  icon: <CreditCardOutlined />,
                },
                {
                  title: "Hoàn tất đơn hàng",
                  icon: <CheckCircleOutlined />,
                },
              ]}
            />
          </div>

          <Row gutter={[36, 36]}>
            <Col xs={24} lg={15}>
              <div className={styles.formCard}>
                <Form
                  form={form}
                  layout="vertical"
                  initialValues={{
                    paymentType: "vnpay",
                  }}
                >
                  {currentStep === 0 && (
                    <div className={styles.stepContent}>
                      <h2 className={styles.stepHeading}>Thông tin liên hệ & Địa chỉ nhận hàng</h2>

                      <Row gutter={16}>
                        <Col xs={24} md={12}>
                          <Form.Item
                            label="Họ và tên người nhận"
                            name="fullName"
                            rules={[{ required: true, message: "Vui lòng nhập họ và tên" }]}
                          >
                            <Input placeholder="Nguyễn Văn A" size="large" />
                          </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                          <Form.Item
                            label="Số điện thoại"
                            name="phone"
                            rules={[{ required: true, message: "Vui lòng nhập số điện thoại" }]}
                          >
                            <Input placeholder="0912 345 678" size="large" />
                          </Form.Item>
                        </Col>
                      </Row>

                      <Form.Item
                        label="Địa chỉ Email"
                        name="email"
                        rules={[
                          { required: true, message: "Vui lòng nhập email" },
                          { type: "email", message: "Email không đúng định dạng" },
                        ]}
                      >
                        <Input placeholder="email@domain.com" size="large" />
                      </Form.Item>

                      <Form.Item
                        label="Địa chỉ chi tiết (Số nhà, tên đường, phường/xã)"
                        name="address"
                        rules={[{ required: true, message: "Vui lòng nhập địa chỉ giao hàng" }]}
                      >
                        <Input placeholder="Số 123 Đường Cầu Giấy, Phường Dịch Vọng" size="large" />
                      </Form.Item>

                      <Row gutter={16}>
                        <Col xs={24} md={12}>
                          <Form.Item
                            label="Tỉnh / Thành phố"
                            name="city"
                            rules={[{ required: true, message: "Vui lòng nhập tỉnh/thành phố" }]}
                          >
                            <Input placeholder="Hà Nội" size="large" />
                          </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                          <Form.Item
                            label="Ghi chú giao hàng (Không bắt buộc)"
                            name="notes"
                          >
                            <Input placeholder="Giao hàng trong giờ hành chính..." size="large" />
                          </Form.Item>
                        </Col>
                      </Row>
                    </div>
                  )}

                  {currentStep === 1 && (
                    <div className={styles.stepContent}>
                      <h2 className={styles.stepHeading}>Chọn phương thức thanh toán</h2>

                      <div className={styles.paymentSelector}>
                        <Radio.Group
                          value={paymentMethod}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          className={styles.radioGroup}
                        >
                          <Radio value="vnpay" className={styles.radioOption}>
                            <div className={styles.optionContent}>
                              <div>
                                <span className={styles.optionTitle}>Cổng thanh toán VNPay</span>
                                <span className={styles.optionSubtitle}>
                                  Hỗ trợ thẻ ATM nội địa, QR Code ngân hàng, Visa/Mastercard
                                </span>
                              </div>
                              <span className={styles.cardBadges}>VNPAY-QR</span>
                            </div>
                          </Radio>

                          <Radio value="momo" className={styles.radioOption}>
                            <div className={styles.optionContent}>
                              <div>
                                <span className={styles.optionTitle}>Ví điện tử MoMo</span>
                                <span className={styles.optionSubtitle}>
                                  Quét mã nhanh chóng qua ứng dụng MoMo
                                </span>
                              </div>
                              <span className={styles.cardBadges}>MoMo</span>
                            </div>
                          </Radio>

                          <Radio value="cod" className={styles.radioOption}>
                            <div className={styles.optionContent}>
                              <div>
                                <span className={styles.optionTitle}>Thanh toán khi nhận hàng (COD)</span>
                                <span className={styles.optionSubtitle}>
                                  Thanh toán tiền mặt cho nhân viên giao hàng sau khi kiểm tra
                                </span>
                              </div>
                              <span className={styles.cardBadges}>Tiền mặt</span>
                            </div>
                          </Radio>
                        </Radio.Group>
                      </div>
                    </div>
                  )}

                  <div className={styles.stepActions}>
                    <Button
                      type="primary"
                      size="large"
                      block
                      className={styles.nextBtn}
                      loading={isSubmitting}
                      onClick={handleNextStep}
                      icon={<ArrowRightOutlined />}
                      iconPosition="end"
                    >
                      {currentStep === 0 ? "Tiếp tục đến Thanh toán" : "Xác nhận & Đặt hàng ngay"}
                    </Button>
                  </div>
                </Form>
              </div>
            </Col>

            <Col xs={24} lg={9}>
              <div className={styles.summaryCard}>
                <h3 className={styles.summaryTitle}>Tóm tắt đơn hàng</h3>

                <div className={styles.miniList}>
                  {cart.map((item) => (
                    <div key={item.productId} className={styles.miniItem}>
                      <img src={item.image} alt={item.name} className={styles.miniImg} />
                      <div className={styles.miniInfo}>
                        <span className={styles.miniName}>{item.name}</span>
                        <span className={styles.miniQty}>Số lượng: {item.quantity}</span>
                      </div>
                      <span className={styles.miniPrice}>
                        {(item.price * item.quantity).toLocaleString("vi-VN")} đ
                      </span>
                    </div>
                  ))}
                </div>

                <Divider style={{ margin: "16px 0" }} />

                <div className={styles.calcRow}>
                  <span>Tạm tính</span>
                  <span>{subtotal.toLocaleString("vi-VN")} đ</span>
                </div>
                <div className={styles.calcRow}>
                  <span>Phí vận chuyển</span>
                  <span>MIỄN PHÍ</span>
                </div>

                <Divider style={{ margin: "16px 0" }} />

                <div className={styles.totalRow}>
                  <span className={styles.totalLabel}>Tổng thanh toán</span>
                  <span className={styles.totalVal}>
                    {total.toLocaleString("vi-VN")} đ
                  </span>
                </div>

                <div className={styles.securitySeal}>
                  <SafetyCertificateOutlined style={{ color: "#52c41a", fontSize: 18 }} />
                  <div>
                    <strong>Chính sách Bảo vệ Người mua eCommerce</strong>
                    <p>Cam kết 100% hàng chính hãng hoặc hoàn tiền gấp đôi.</p>
                  </div>
                </div>
              </div>
            </Col>
          </Row>
        </div>
      </main>

      <Footer />
    </div>
  );
}
