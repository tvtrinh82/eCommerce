"use client";

import React, { useEffect, useState } from "react";
import { Layout, Menu, Typography, Badge, Space, Dropdown, message, ConfigProvider, theme, Switch, Drawer, List, Button, Modal, Form, Input, FloatButton, Tooltip } from "antd";
import { ShoppingOutlined, ShoppingCartOutlined, SearchOutlined, UserOutlined, LogoutOutlined, BulbOutlined, BulbFilled, MenuOutlined, MessageOutlined } from "@ant-design/icons";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useThemeStore } from "@/store/themeStore";
import { useCartStore } from "@/store/cartStore";

const { Header, Content, Footer } = Layout;
const { Title, Text } = Typography;

const MENU_ITEMS = [
  { key: "iphone", label: "iPhone" },
  { key: "ipad", label: "iPad" },
  { key: "mac", label: "Mac" },
  { key: "watch", label: "Watch" },
  { key: "phu-kien", label: "Phụ kiện" },
  { key: "am-thanh", label: "Âm thanh" },
  { key: "camera", label: "Camera" },
  { key: "gia-dung", label: "Gia dụng" },
  { key: "may-luot", label: "Máy lướt" },
];

const SERVICE_ITEMS = [
  { key: 'svc-1', label: 'Trung tâm bảo hành uỷ quyền Apple (S)' },
  { key: 'svc-2', label: 'Apple Care' },
  { key: 'svc-3', label: 'Bán hàng doanh nghiệp' },
  { key: 'svc-4', label: 'Bảo Hành Mở Rộng' },
  { key: 'svc-5', label: 'Bảo Hành Vip 1 đổi 1' },
  { key: 'svc-6', label: 'Bảo Hành Kim Cương' },
  { key: 'svc-7', label: 'Gói Microsoft-Office' },
  { key: 'svc-8', label: 'Thu Cũ Đổi Mới' },
  { key: 'svc-9', label: 'Dịch vụ sim thẻ' },
  { key: 'svc-10', label: 'Dịch vụ trả góp' },
  { key: 'svc-11', label: 'Chương trình WorkShop' },
  { key: 'svc-12', label: 'Tin Tức' },
];

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [profileForm] = Form.useForm();
  const router = useRouter();
  const { isDarkMode, toggleTheme } = useThemeStore();
  const { cart, isCartVisible, setCartVisible, removeFromCart } = useCartStore();
  const { token } = theme.useToken();
  const [loading, setLoading] = useState(false);
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const res = await fetch("/api/auth/me", {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            const userData = data.data || data;

            // Fetch customer data if customerId exists
            if (userData.customerId) {
              const cRes = await fetch(`/api/customers/${userData.customerId}`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              if (cRes.ok) {
                const cData = await cRes.json();
                const customerInfo = cData.data || cData;
                setUser({ ...userData, ...customerInfo });
                return;
              }
            }
            setUser(userData);
          }
        } catch (e) {
          console.error("Failed to fetch user", e);
        }
      }
    };
    fetchUser();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    setUser(null);
    message.success("Đã đăng xuất thành công");
    router.push("/auth/login");
  };

  const handleUpdateProfile = async (values: any) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/customers/${user.customerId || user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ ...values, email: user.email }) // Pass existing required fields if needed
      });
      if (res.ok) {
        message.success("Cập nhật thông tin thành công");
        setUser({ ...user, ...values });
        setIsProfileModalOpen(false);
      } else {
        message.error("Cập nhật thất bại");
      }
    } catch (e) {
      message.error("Lỗi khi cập nhật thông tin");
    }
  };

  const openProfileModal = () => {
    profileForm.setFieldsValue({
      name: user?.name,
      email: user?.email,
      phone: user?.phone,
      address: user?.address
    });
    setIsProfileModalOpen(true);
  };

  const userMenuProps = {
    items: [
      {
        key: 'info',
        label: (
          <div style={{ padding: '4px 0', cursor: 'pointer' }} onClick={openProfileModal}>
            <Text strong>{user?.name || "Người dùng"}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>Chỉnh sửa thông tin</Text>
          </div>
        )
      },
      { type: 'divider' as const },
      {
        key: 'history',
        label: 'Lịch sử mua hàng',
        onClick: () => router.push('/orders/history') // Assuming you have or will create this route
      },
      { type: 'divider' as const },
      {
        key: 'logout',
        label: 'Đăng xuất',
        icon: <LogoutOutlined />,
        onClick: handleLogout,
        danger: true
      }
    ]
  };

  return (
    <ConfigProvider
      theme={{
        algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: isDarkMode ? '#ffffff' : '#18181b',
          colorBgBase: isDarkMode ? '#0f0f11' : '#f5f5f7',
          colorTextBase: isDarkMode ? '#f4f4f5' : '#18181b',
          borderRadius: 8,
          fontFamily: 'inherit'
        },
        components: {
          Layout: {
            headerBg: isDarkMode ? 'rgba(18, 18, 20, 0.85)' : 'rgba(255, 255, 255, 0.85)',
            footerBg: isDarkMode ? '#09090b' : '#18181b',
            bodyBg: isDarkMode ? '#0f0f11' : '#f5f5f7'
          },
          Card: {
            colorBgContainer: isDarkMode ? '#18181b' : '#ffffff',
            colorBorderSecondary: isDarkMode ? '#27272a' : '#e4e4e7'
          }
        }
      }}
    >
      <Layout style={{ minHeight: "100vh", backgroundColor: isDarkMode ? '#0f0f11' : '#f5f5f7' }}>

        <Header style={{
          position: 'sticky',
          top: 0,
          zIndex: 1000,
          width: '100%',
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 10%",
          height: 64,
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderBottom: isDarkMode ? '1px solid #27272a' : '1px solid #e4e4e7'
        }}>
          {/* LOGO ECOMMERCE */}
          <div
            style={{
              cursor: "pointer",
              marginRight: 32,
              userSelect: "none",
              display: "flex",
              alignItems: "center",
              gap: 10,
              height: "100%"
            }}
            onClick={() => router.push("/")}
          >
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 8,
                background: "linear-gradient(135deg, #1677FF 0%, #0050B3 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
                fontSize: 18,
                boxShadow: "0 4px 12px rgba(22, 119, 255, 0.3)"
              }}
            >
              <ShoppingOutlined />
            </div>
            <span style={{ fontSize: 19, fontWeight: 800, color: !isDarkMode ? "#1f1f1f" : "#ffffff", letterSpacing: "-0.5px" }}>
              e<span style={{ color: "#1677FF" }}>Commerce</span>
            </span>
          </div>

          {/* DESKTOP MENU */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, minWidth: 0 }}>
            <Dropdown
              menu={{
                items: SERVICE_ITEMS,
                onClick: (e) => setSelectedService(SERVICE_ITEMS.find(s => s.key === e.key)?.label || null)
              }}
              placement="bottom"
            >
              <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 500, fontSize: 14, whiteSpace: 'nowrap' }}>
                <MenuOutlined /> Dịch vụ
              </div>
            </Dropdown>

            <Menu
              theme={isDarkMode ? "dark" : "light"}
              mode="horizontal"
              items={MENU_ITEMS}
              overflowedIndicator={null}
              disabledOverflow={true}
              style={{
                backgroundColor: "transparent",
                borderBottom: "none",
                fontSize: 14,
                justifyContent: "center",
                display: "flex",
                flexWrap: "nowrap"
              }}
            />
          </div>

          {/* ICONS */}
          <Space size="middle" style={{ fontSize: 20, alignItems: 'center', display: 'flex' }}>
            {/* NÚT ĐẢO NGƯỢC MÀU (LIGHT / DARK SWITCH) */}
            <Tooltip title={isDarkMode ? "Chuyển sang giao diện Sáng" : "Chuyển sang giao diện Tối"}>
              <Button
                type="text"
                shape="circle"
                icon={isDarkMode ? <BulbFilled style={{ color: "#fbbf24", fontSize: 18 }} /> : <BulbOutlined style={{ fontSize: 18 }} />}
                onClick={toggleTheme}
                style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
              />
            </Tooltip>

            {isSearchVisible ? (
              <Input
                autoFocus
                placeholder="Tìm kiếm sản phẩm..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onPressEnter={() => {
                  setIsSearchVisible(false);
                  if (searchQuery.trim()) {
                    router.push(`/?search=${encodeURIComponent(searchQuery)}`);
                  }
                }}
                onBlur={() => setIsSearchVisible(false)}
                suffix={<SearchOutlined onClick={() => setIsSearchVisible(false)} style={{ cursor: "pointer" }} />}
                style={{ width: 200, borderRadius: 20 }}
              />
            ) : (
              <SearchOutlined style={{ cursor: "pointer" }} onClick={() => setIsSearchVisible(true)} />
            )}

            <Badge count={cart.length} size="small">
              <ShoppingCartOutlined style={{ cursor: "pointer", fontSize: 20 }} onClick={() => setCartVisible(true)} />
            </Badge>

            {user ? (
              <Dropdown menu={userMenuProps} trigger={['click']} placement="bottomRight">
                <UserOutlined style={{ cursor: "pointer" }} />
              </Dropdown>
            ) : (
              <Link href="/auth/login" style={{ color: isDarkMode ? "#fff" : "#000" }}>
                <UserOutlined style={{ cursor: "pointer" }} />
              </Link>
            )}
          </Space>
        </Header>

        <Content style={{ width: "100%", margin: "0 auto" }}>
          {children}
        </Content>

        <Footer style={{ padding: "60px 10%", backgroundColor: '#1d1d1f', color: '#86868b' }}>
          <div style={{ maxWidth: 1400, margin: "0 auto" }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 40, justifyContent: 'space-between' }}>
              <div style={{ flex: '1 1 250px' }}>
                <div
                  style={{ cursor: "pointer", display: "inline-block", marginBottom: 14 }}
                  onClick={() => router.push("/")}
                >
                  <div
                    className="creative-blink-logo"
                    style={{ marginBottom: 0, padding: "5px 14px", gap: 10, display: "inline-flex" }}
                  >
                    <div className="blink-icon-wrap" style={{ width: 34, height: 34, fontSize: 18, borderRadius: 10 }}>
                      <ShoppingOutlined />
                      <span className="blink-dot" style={{ top: 2, right: 2, width: 7, height: 7 }}></span>
                    </div>
                    <span className="blink-brand-name" style={{ fontSize: 20 }}>
                      e<span className="blink-accent">Commerce</span>
                    </span>
                  </div>
                </div>
                <Text style={{ display: 'block', marginBottom: 8, color: '#86868b' }}>Đại lý uỷ quyền cao cấp các thiết bị điện tử chính hãng.</Text>
                <Text style={{ display: 'block', color: '#86868b' }}>Hotline mua hàng: 1900 6666</Text>
                <Text style={{ display: 'block', color: '#86868b' }}>Bán hàng doanh nghiệp: 1900 8888</Text>
                <Text style={{ display: 'block', color: '#86868b', marginTop: 16 }}>SDCARE - Trung tâm bảo hành uỷ quyền Apple</Text>
                <Text style={{ display: 'block', color: '#86868b' }}>Hesman Care - Trung tâm bảo hành uỷ quyền thiết bị số</Text>
              </div>
              <div style={{ flex: '1 1 200px' }}>
                <Title level={5} style={{ color: '#fff' }}>Thông tin</Title>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 20 }}>
                  <Link href="#" style={{ color: '#a1a1a6' }}>Newsfeed</Link>
                  <Link href="#" style={{ color: '#a1a1a6' }}>Giới thiệu</Link>
                  <Link href="#" style={{ color: '#a1a1a6' }}>Check IMEI</Link>
                  <Link href="#" style={{ color: '#a1a1a6' }}>Phương thức thanh toán</Link>
                  <Link href="#" style={{ color: '#a1a1a6' }}>Tuyển dụng</Link>
                </div>
              </div>
              <div style={{ flex: '1 1 200px' }}>
                <Title level={5} style={{ color: '#fff' }}>Chính sách</Title>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 20 }}>
                  <Link href="#" style={{ color: '#a1a1a6' }}>Thu cũ đổi mới</Link>
                  <Link href="#" style={{ color: '#a1a1a6' }}>Giao hàng</Link>
                  <Link href="#" style={{ color: '#a1a1a6' }}>Đổi trả</Link>
                  <Link href="#" style={{ color: '#a1a1a6' }}>Bảo hành</Link>
                  <Link href="#" style={{ color: '#a1a1a6' }}>Dịch vụ</Link>
                </div>
              </div>
              <div style={{ flex: '1 1 200px' }}>
                <Title level={5} style={{ color: '#fff' }}>Địa chỉ & Liên hệ</Title>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 20 }}>
                  <Link href="#" style={{ color: '#a1a1a6' }}>Tài khoản</Link>
                  <Link href="#" style={{ color: '#a1a1a6' }}>Tìm Store trên Google Map</Link>
                  <Link href="#" style={{ color: '#a1a1a6' }}>Hệ thống cửa hàng</Link>
                  <Text style={{ color: '#a1a1a6', display: 'block', marginTop: 12 }}>Hotline Miền Bắc: 0988.888.888</Text>
                  <Text style={{ color: '#a1a1a6', display: 'block' }}>Hotline Miền Nam: 0999.999.999</Text>
                </div>
              </div>
            </div>
            <div style={{ marginTop: 60, textAlign: "center", borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 30 }}>
              <Text style={{ color: '#86868b', fontSize: 13 }}>© {new Date().getFullYear()} ECommerce Inc. All rights reserved. Designed to look like ShopDunk.</Text>
            </div>
          </div>
        </Footer>
      </Layout>

      {/* GLOBAL SHOPPING CART DRAWER */}
      <Drawer
        title={<span style={{ fontSize: 20, fontWeight: 600, color: '#1d1d1f' }}>Giỏ hàng</span>}
        placement="right"
        onClose={() => setCartVisible(false)}
        open={isCartVisible}
        size="default"
        styles={{ header: { borderBottom: 'none', padding: '24px 24px 0' }, body: { padding: 24 } }}
      >
        <List
          itemLayout="horizontal"
          dataSource={cart}
          locale={{ emptyText: "Giỏ hàng trống" }}
          renderItem={(item) => (
            <List.Item
              style={{ borderBottom: '1px solid #f0f0f0', padding: '16px 0' }}
              actions={[
                <Button danger type="text" onClick={() => removeFromCart(item.productId)}>
                  Xoá
                </Button>
              ]}
            >
              <List.Item.Meta
                avatar={<img src={item.image || "https://placehold.co/200x200?text=No+Image"} alt={item.name} style={{ width: 60, height: 60, objectFit: 'contain' }} />}
                title={<span style={{ fontSize: 15, color: '#1d1d1f' }}>{item.name}</span>}
                description={
                  <div style={{ marginTop: 8 }}>
                    <Text style={{ color: token.colorPrimary, fontWeight: 600 }}>{item.price.toLocaleString("vi-VN")} đ</Text>
                    <div style={{ marginTop: 4, color: isDarkMode ? '#a1a1a6' : '#86868b' }}>Số lượng: {item.quantity}</div>
                  </div>
                }
              />
            </List.Item>
          )}
        />
        {cart.length > 0 && (
          <div style={{ marginTop: 24, paddingTop: 24, borderTop: isDarkMode ? "1px solid #333" : "1px solid #f0f0f0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24, fontSize: 18, fontWeight: "bold" }}>
              <span style={{ color: isDarkMode ? '#fff' : '#1d1d1f' }}>Tổng cộng:</span>
              <span style={{ color: token.colorPrimary }}>
                {cart.reduce((sum, item) => sum + item.price * item.quantity, 0).toLocaleString("vi-VN")} đ
              </span>
            </div>
            <Button type="primary" block size="large" shape="round" onClick={() => { setCartVisible(false); router.push("/orders/new"); }} style={{ height: 50, fontSize: 16, fontWeight: 600 }}>
              Tiến hành thanh toán
            </Button>
          </div>
        )}
      </Drawer>

      {/* PROFILE EDIT MODAL */}
      <Modal
        title="Thông tin người dùng"
        open={isProfileModalOpen}
        onCancel={() => setIsProfileModalOpen(false)}
        footer={null}
      >
        <Form form={profileForm} layout="vertical" onFinish={handleUpdateProfile}>

          <Form.Item name="name" label="Họ tên" rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}>
            <Input placeholder="Nhập họ tên" size="large" />
          </Form.Item>
          <Form.Item name="email" label="Email (Tài khoản)">
            <Input disabled size="large" />
          </Form.Item>
          <Form.Item name="phone" label="Số điện thoại" rules={[{ required: true, message: 'Vui lòng nhập số điện thoại' }]}>
            <Input placeholder="Nhập số điện thoại" size="large" />
          </Form.Item>
          {/* <Form.Item name="address" label="Địa chỉ">
            <Input.TextArea placeholder="Nhập địa chỉ nhận hàng" rows={3} size="large" />
          </Form.Item> */}
          <Button type="primary" htmlType="submit" size="large" block style={{ marginTop: 16 }}>
            Cập nhật
          </Button>
        </Form>
      </Modal>

      {/* SERVICE MODAL */}
      <Modal
        title={selectedService}
        open={!!selectedService}
        onCancel={() => setSelectedService(null)}
        footer={[
          <Button key="close" onClick={() => setSelectedService(null)}>Đóng</Button>,
          <Button key="action" type="primary" onClick={() => setSelectedService(null)}>Xem chi tiết</Button>
        ]}
      >
        <p>Chào mừng bạn đến với <b>{selectedService}</b>.</p>
        <p>Đây là dịch vụ chính hãng chuẩn Apple giúp mang lại trải nghiệm hoàn hảo cho khách hàng.</p>
        <p>Vui lòng liên hệ tổng đài 1900 6666 để được tư vấn thêm về dịch vụ này.</p>
      </Modal>

      {/* FLOATING CHAT BUTTON & SCROLL TO TOP */}
      <FloatButton.Group shape="circle" style={{ right: 24, bottom: 24 }}>
        <FloatButton icon={<MessageOutlined />} type="primary" tooltip="Chat với nhân viên CSKH" />
        <FloatButton.BackTop visibilityHeight={100} />
      </FloatButton.Group>

    </ConfigProvider>
  );
}
