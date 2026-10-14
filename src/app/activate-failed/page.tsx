"use client";

import React, { useEffect, useState } from "react";
import { Result, Button, Card } from "antd";
import { useRouter } from "next/navigation";

import styles from "./ActivateFailed.module.scss";

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
    <div className={styles.container}>
      <Card className={styles.card}>
        <Result
          status="error"
          title="Xác thực tài khoản không thành công"
          subTitle={errorMsg}
          extra={[
            <Button 
              type="primary" 
              key="login" 
              size="large"
              className={styles.submitBtn}
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
