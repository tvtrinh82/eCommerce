"use client";

import React, { useEffect, useState } from "react";
import { Result, Button, Card } from "antd";
import { useRouter } from "next/navigation";
import Link from "next/link";

import styles from "./ActivateSuccess.module.scss";

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
    <div className={styles.container}>
      <Card className={styles.card}>
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
              className={styles.loginBtn}
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
