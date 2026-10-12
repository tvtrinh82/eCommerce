"use client";

import React, { useEffect, useState } from "react";
import { Result, Button, Card } from "antd";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ActivateSuccessPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string>("");

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const emailParam = searchParams.get("email");
    if (emailParam) {
      setEmail(emailParam);
    }
  }, []);

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", backgroundColor: "#f0f2f5" }}>
      <Card style={{ width: 500, borderRadius: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
        <Result
          status="success"
          title="Xác thực tài khoản thành công!"
          subTitle={
            email 
              ? <span>Tài khoản <b>{email}</b> của bạn đã sẵn sàng.</span>
              : "Tài khoản của bạn đã được kích hoạt thành công và sẵn sàng sử dụng."
          }
          extra={[
            <Button 
              type="primary" 
              key="login" 
              size="large"
              style={{ borderRadius: 8, width: "100%", maxWidth: 200 }}
              onClick={() => {
                if (email) {
                  router.push(`/auth/login?email=${encodeURIComponent(email)}`);
                } else {
                  router.push("/auth/login");
                }
              }}
            >
              Đi đến Đăng nhập
            </Button>
          ]}
        />
      </Card>
    </div>
  );
}
