"use client";

import React from 'react';
import styles from './LoadingSkeleton.module.scss';

interface LoadingSkeletonProps {
  count?: number;
}

export function LoadingSkeleton({ count = 8 }: LoadingSkeletonProps) {
  return (
    <div className={styles.grid}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className={styles.skeletonCard}>
          <div className={styles.imagePlaceholder} />
          <div className={styles.lineLong} />
          <div className={styles.lineShort} />
          <div className={styles.btnPlaceholder} />
        </div>
      ))}
    </div>
  );
}
