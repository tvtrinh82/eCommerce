"use client";

import React, { useState } from "react";
import { Layout, Menu, Typography, Button, Avatar, Space, Badge, Dropdown, message, ConfigProvider } from "antd";
import {LayoutDashboard,ShoppingCart,Users,Package,Settings,Bell,Search,Globe,LogOut,User,UserCheck,Mail,BarChart
} from "lucide-react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

const { Header, Sider, Content } = Layout;
const { Title } = Typography;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  const pathname = usePathname();
  const [messageApi, contextHolder] = message.useMessage();

  React.useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const res = await fetch("/api/auth/me", {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            setUser(data.data || data);
          }
        } catch (e) {
          console.error("Failed to fetch user");
        }
      }
    };
    fetchUser();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    messageApi.success("Đã đăng xuất");
    router.push("/auth/login");
  };

  const userMenu = {
    items: [
      {
        key: 'profile',
        label: (
          <div style={{ padding: '4px 0', minWidth: 120 }}>
            <Typography.Text strong style={{ display: 'block' }}>{user?.name || user?.username || "Admin"}</Typography.Text>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>{user?.email || "admin@example.com"}</Typography.Text>
          </div>
        ),
      },
      { type: 'divider' as const },
      {
        key: 'logout',
        icon: <LogOut size={16} />,
        label: 'Đăng xuất',
        danger: true,
        onClick: handleLogout,
      },
    ],
  };
  const menuItems = [
    { key: "/admin", label: "Tổng quan", icon: <LayoutDashboard size={20} /> },
    { key: "/admin/products", label: "Sản phẩm", icon: <Package size={20} /> },
    { key: "/admin/customers", label: "Khách hàng", icon: <Users size={20} /> },
    { key: "/admin/employees", label: "Nhân viên", icon: <UserCheck size={20} /> },
    { key: "/admin/orders", label: "Đơn hàng", icon: <ShoppingCart size={20} /> },
    { key: "/admin/dashboard", label: "Bảng điều khiển", icon: <BarChart size={20} /> },
    { key: "/admin/emails", label: "Mail lỗi", icon: <Mail size={20} /> },
    { key: "/admin/reports", label: "Báo cáo", icon: <span>▤</span> },
  ];

  const handleNavigate = (path: string) => {
    router.push(path);
  };

  return (
    <Layout className="admin-layout-root" style={{ minHeight: "100vh", zoom: "125%" }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={(value) => setCollapsed(value)}
        theme="dark"
        style={{
          background: "#515154",
          position: "fixed",
          left: 0,
          top: 0,
          bottom: 0,
          height: "100vh",
          overflowY: "auto",
          zIndex: 100,
        }}
      >
        <div style={{ height: 64, margin: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{
            width: 40,
            height: 40,
            backgroundColor: "#fff",
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#515154",
            fontWeight: "bold",
            fontSize: 20
          }}>
            E
          </div>
          {!collapsed && <Title level={4} style={{ margin: "0 0 0 12px", color: "#fff" }}>Commerce</Title>}
        </div>
        <ConfigProvider theme={{ components: { Menu: { itemHeight: 48, fontSize: 18, itemMarginInline: 12 } } }}>
          <Menu
            theme="dark"
            selectedKeys={[pathname]}
            mode="inline"
            items={menuItems}
            onClick={({ key }) => handleNavigate(key)}
            style={{ background: "#515154" }}
          />
        </ConfigProvider>
      </Sider>

      <Layout
        className="site-layout"
        style={{
          background: "#f5f5f7",
          marginLeft: collapsed ? 80 : 200,
          transition: "margin-left 0.2s ease",
          minHeight: "100vh",
        }}
      >
        <Header style={{ padding: "0 24px", background: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 1px 4px rgba(0,21,41,.08)", zIndex: 9 }}>
          <div>
            <Title level={4} style={{ margin: 0, color: "#1f1f1f" }}>
              {menuItems.find(m => m.key === pathname)?.label || "Tổng quan"}
            </Title>
          </div>
          <Space size="large">
            <Dropdown menu={userMenu} placement="bottomRight" trigger={['click']} getPopupContainer={(triggerNode) => triggerNode.parentNode as HTMLElement}>
              <Avatar style={{ backgroundColor: '#515154', cursor: 'pointer' }}>
                {user?.name ? user.name.charAt(0).toUpperCase() : user?.username ? user.username.charAt(0).toUpperCase() : 'A'}
              </Avatar>
            </Dropdown>
          </Space>
        </Header>

        <Content style={{ margin: "24px 16px", minHeight: 280 }}>
          {contextHolder}
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}
