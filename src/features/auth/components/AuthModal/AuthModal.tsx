"use client";

import React, { useState } from 'react';
import { Modal, Tabs, Input, Button } from 'antd';
import { MailOutlined, LockOutlined, UserOutlined, PhoneOutlined, ShoppingOutlined } from '@ant-design/icons';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useUIStore } from '@/stores/uiStore';
import { useLogin, useRegister } from '../../hooks';
import { LoginFormData, RegisterFormData, loginSchema, registerSchema } from '../../types';
import styles from './AuthModal.module.scss';

export function AuthModal() {
  const { isAuthModalOpen, authModalTab, openAuthModal, closeAuthModal } = useUIStore();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [registerSuccessEmail, setRegisterSuccessEmail] = useState<string | null>(null);

  const loginMutation = useLogin();
  const registerMutation = useRegister();

  // Sync activeTab with store when modal opens
  React.useEffect(() => {
    if (isAuthModalOpen) {
      setActiveTab(authModalTab);
      setRegisterSuccessEmail(null);
    }
  }, [isAuthModalOpen, authModalTab]);

  // Login form
  const {
    control: loginControl,
    handleSubmit: handleLoginSubmit,
    formState: { errors: loginErrors },
    reset: resetLoginForm,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  // Register form
  const {
    control: registerControl,
    handleSubmit: handleRegisterSubmit,
    formState: { errors: registerErrors },
    reset: resetRegisterForm,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onLogin = (data: LoginFormData) => {
    loginMutation.mutate(data);
  };

  const onRegister = (data: RegisterFormData) => {
    registerMutation.mutate(data, {
      onSuccess: () => {
        setRegisterSuccessEmail(data.email);
        resetRegisterForm();
      },
    });
  };

  const handleClose = () => {
    resetLoginForm();
    resetRegisterForm();
    setRegisterSuccessEmail(null);
    closeAuthModal();
  };

  const tabItems = [
    {
      key: 'login',
      label: 'Đăng nhập',
      children: (
        <form onSubmit={handleLoginSubmit(onLogin)}>
          <div className={styles.formItem}>
            <label className={styles.fieldLabel}>Email</label>
            <Controller
              name="email"
              control={loginControl}
              render={({ field }) => (
                <Input
                  {...field}
                  placeholder="name@example.com"
                  prefix={<MailOutlined />}
                  status={loginErrors.email ? 'error' : ''}
                />
              )}
            />
            {loginErrors.email && (
              <div className={styles.errorMessage}>{loginErrors.email.message}</div>
            )}
          </div>

          <div className={styles.formItem}>
            <label className={styles.fieldLabel}>Mật khẩu</label>
            <Controller
              name="password"
              control={loginControl}
              render={({ field }) => (
                <Input.Password
                  {...field}
                  placeholder="Nhập mật khẩu"
                  prefix={<LockOutlined />}
                  status={loginErrors.password ? 'error' : ''}
                />
              )}
            />
            {loginErrors.password && (
              <div className={styles.errorMessage}>{loginErrors.password.message}</div>
            )}
          </div>

          <Button
            type="primary"
            htmlType="submit"
            className={styles.submitBtn}
            loading={loginMutation.isPending}
          >
            Đăng nhập
          </Button>

          <div className={styles.switchPrompt}>
            Chưa có tài khoản?{' '}
            <button
              type="button"
              onClick={() => {
                setActiveTab('register');
                openAuthModal('register');
              }}
            >
              Đăng ký ngay
            </button>
          </div>
        </form>
      ),
    },
    {
      key: 'register',
      label: 'Đăng ký',
      children: registerSuccessEmail ? (
        <div className={styles.successNotice}>
          <div className={styles.noticeTitle}>Đã gửi email kích hoạt!</div>
          <p className={styles.noticeDesc}>
            Chúng tôi đã gửi liên kết kích hoạt tài khoản đến <strong>{registerSuccessEmail}</strong>.
            <br />
            Vui lòng kiểm tra hộp thư đến (hoặc thư mục Spam) và nhấp vào liên kết để kích hoạt tài khoản trước khi đăng nhập.
          </p>
          <Button
            type="primary"
            className={styles.submitBtn}
            onClick={() => {
              setRegisterSuccessEmail(null);
              setActiveTab('login');
              openAuthModal('login');
            }}
          >
            Chuyển sang Đăng nhập
          </Button>
        </div>
      ) : (
        <form onSubmit={handleRegisterSubmit(onRegister)}>
          <div className={styles.formItem}>
            <label className={styles.fieldLabel}>Họ và tên</label>
            <Controller
              name="name"
              control={registerControl}
              render={({ field }) => (
                <Input
                  {...field}
                  placeholder="Nguyễn Văn A"
                  prefix={<UserOutlined />}
                  status={registerErrors.name ? 'error' : ''}
                />
              )}
            />
            {registerErrors.name && (
              <div className={styles.errorMessage}>{registerErrors.name.message}</div>
            )}
          </div>

          <div className={styles.formItem}>
            <label className={styles.fieldLabel}>Email (@gmail.com)</label>
            <Controller
              name="email"
              control={registerControl}
              render={({ field }) => (
                <Input
                  {...field}
                  placeholder="example@gmail.com"
                  prefix={<MailOutlined />}
                  status={registerErrors.email ? 'error' : ''}
                />
              )}
            />
            {registerErrors.email && (
              <div className={styles.errorMessage}>{registerErrors.email.message}</div>
            )}
          </div>

          <div className={styles.formItem}>
            <label className={styles.fieldLabel}>Số điện thoại</label>
            <Controller
              name="phone"
              control={registerControl}
              render={({ field }) => (
                <Input
                  {...field}
                  placeholder="0987654321"
                  prefix={<PhoneOutlined />}
                  status={registerErrors.phone ? 'error' : ''}
                />
              )}
            />
            {registerErrors.phone && (
              <div className={styles.errorMessage}>{registerErrors.phone.message}</div>
            )}
          </div>

          <div className={styles.formItem}>
            <label className={styles.fieldLabel}>Mật khẩu</label>
            <Controller
              name="password"
              control={registerControl}
              render={({ field }) => (
                <Input.Password
                  {...field}
                  placeholder="Tối thiểu 8 ký tự, 1 hoa, 1 số, 1 ký tự đặc biệt"
                  prefix={<LockOutlined />}
                  status={registerErrors.password ? 'error' : ''}
                />
              )}
            />
            {registerErrors.password && (
              <div className={styles.errorMessage}>{registerErrors.password.message}</div>
            )}
          </div>

          <div className={styles.formItem}>
            <label className={styles.fieldLabel}>Xác nhận mật khẩu</label>
            <Controller
              name="confirmPassword"
              control={registerControl}
              render={({ field }) => (
                <Input.Password
                  {...field}
                  placeholder="Nhập lại mật khẩu"
                  prefix={<LockOutlined />}
                  status={registerErrors.confirmPassword ? 'error' : ''}
                />
              )}
            />
            {registerErrors.confirmPassword && (
              <div className={styles.errorMessage}>{registerErrors.confirmPassword.message}</div>
            )}
          </div>

          <Button
            type="primary"
            htmlType="submit"
            className={styles.submitBtn}
            loading={registerMutation.isPending}
          >
            Đăng ký tài khoản
          </Button>

          <div className={styles.switchPrompt}>
            Đã có tài khoản?{' '}
            <button
              type="button"
              onClick={() => {
                setActiveTab('login');
                openAuthModal('login');
              }}
            >
              Đăng nhập ngay
            </button>
          </div>
        </form>
      ),
    },
  ];

  return (
    <Modal
      open={isAuthModalOpen}
      onCancel={handleClose}
      footer={null}
      width={460}
      centered
      className={styles.modalWrap}
      destroyOnHidden={false}
    >
      <div className={styles.modalHeader}>
        <div className={styles.logoTitle}>
          <img src="/logo.png" alt="Logo" className={styles.logoImg} />
          E-<span>Commerce</span>
        </div>
        <p className={styles.subtitle}>Mua sắm thông minh, trải nghiệm đỉnh cao</p>
      </div>

      <div className={styles.tabWrapper}>
        <Tabs
          activeKey={activeTab}
          onChange={(key) => {
            setActiveTab(key as 'login' | 'register');
            openAuthModal(key as 'login' | 'register');
          }}
          centered
          items={tabItems}
        />
      </div>
    </Modal>
  );
}
