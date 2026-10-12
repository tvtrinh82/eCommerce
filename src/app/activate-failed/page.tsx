"use client";

import React, { useEffect, useState } from "react";
import { Result, Button, Card } from "antd";
import { useRouter } from "next/navigation";

export default function ActivateFailedPage() {
  const router = useRouter();
  const [errorMsg, setErrorMsg] = useState<string>("Đã có lỗi xảy ra trong quá trình xác thực.");

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const errorParam = searchParams.get("error");
    if (errorParam) {
      setErrorMsg(decodeURIComponent(errorParam));
    }
  }, []);

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", backgroundColor: "#f0f2f5" }}>
      <Card style={{ width: 500, borderRadius: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
        <Result
          status="error"
          title="Xác thực tài khoản không thành công"
          subTitle={errorMsg}
          extra={[
            <Button 
              type="primary" 
              key="login" 
              size="large"
              style={{ borderRadius: 8, width: "100%" }}
              onClick={() => router.push("/auth/login")}
            >
              Đi đến trang Đăng nhập để nhận lại liên kết mới
            </Button>
          ]}
        />
      </Card>
    </div>
  );
}
