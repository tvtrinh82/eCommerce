"use client";

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider, App } from 'antd';
import { ReactNode, useState } from 'react';
import viVN from 'antd/locale/vi_VN';

export default function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider
        locale={viVN}
        theme={{
          token: {
            colorPrimary: '#2563eb', // Royal Blue brand matching Hero section
            colorPrimaryHover: '#1d4ed8',
            colorPrimaryActive: '#1e40af',
            colorSuccess: '#10b981',
            colorWarning: '#f59e0b',
            colorError: '#ef4444',
            colorInfo: '#2563eb',
            colorTextBase: '#111827',
            colorBgBase: '#ffffff',
            borderRadius: 8,
            fontFamily: 'var(--font-main), "Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          },
          components: {
            Button: {
              controlHeight: 36,
              borderRadius: 8,
              fontWeight: 600,
              contentFontSize: 13,
              contentFontSizeSM: 12,
              contentFontSizeLG: 14,
            },
            Input: {
              controlHeight: 40,
              borderRadius: 8,
            },
            Select: {
              controlHeight: 40,
              borderRadius: 8,
            },
            Card: {
              borderRadiusLG: 12,
            },
            Modal: {
              borderRadiusLG: 14,
            },
          },
        }}
      >
        <App>
          {children}
        </App>
      </ConfigProvider>
    </QueryClientProvider>
  );
}
