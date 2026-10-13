"use client";

import React, { useEffect, useState } from 'react';
import { useUIStore } from '@/stores/uiStore';
import styles from './FlyToCartAnimation.module.scss';

export function FlyToCartAnimation() {
  const { flyOrigin, clearFlyEffect } = useUIStore();
  const [coords, setCoords] = useState<{
    startX: number;
    startY: number;
    targetX: number;
    targetY: number;
  } | null>(null);

  useEffect(() => {
    if (flyOrigin) {
      const cartEl = document.getElementById('header-cart-icon');
      const cartRect = cartEl ? cartEl.getBoundingClientRect() : null;

      const targetX = cartRect ? cartRect.left + cartRect.width / 2 : window.innerWidth - 60;
      const targetY = cartRect ? cartRect.top + cartRect.height / 2 : 30;

      setCoords({
        startX: flyOrigin.x,
        startY: flyOrigin.y,
        targetX,
        targetY,
      });

      const timer = setTimeout(() => {
        clearFlyEffect();
        setCoords(null);
      }, 750);

      return () => clearTimeout(timer);
    }
  }, [flyOrigin, clearFlyEffect]);

  if (!coords) return null;

  return (
    <div
      className={styles.flyBall}
      style={
        {
          '--start-x': `${coords.startX}px`,
          '--start-y': `${coords.startY}px`,
          '--target-x': `${coords.targetX}px`,
          '--target-y': `${coords.targetY}px`,
        } as React.CSSProperties
      }
    />
  );
}
