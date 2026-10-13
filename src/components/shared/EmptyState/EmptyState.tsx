"use client";

import React from 'react';
import { Button } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import styles from './EmptyState.module.scss';

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export function EmptyState({
  title = 'Không có dữ liệu',
  description = 'Hiện tại chưa có thông tin nào để hiển thị.',
  actionText,
  onAction,
  icon,
}: EmptyStateProps) {
  return (
    <div className={styles.emptyWrap}>
      <div className={styles.icon}>{icon || <InboxOutlined />}</div>
      <h4 className={styles.title}>{title}</h4>
      <p className={styles.desc}>{description}</p>
      {actionText && onAction && (
        <Button type="primary" onClick={onAction}>
          {actionText}
        </Button>
      )}
    </div>
  );
}
