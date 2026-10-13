"use client";

import React from 'react';
import { Header } from './Header/Header';
import { Footer } from './Footer/Footer';
import { AuthModal } from '@/features/auth/components/AuthModal/AuthModal';
import { AddToCartModal } from '@/features/cart/components/AddToCartModal/AddToCartModal';
import { FlyToCartAnimation } from './FlyToCartAnimation/FlyToCartAnimation';
import styles from './ClientLayout.module.scss';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.wrapper}>
      <Header />
      <main className={styles.mainContent}>{children}</main>
      <Footer />
      <AuthModal />
      <AddToCartModal />
      <FlyToCartAnimation />
    </div>
  );
}
