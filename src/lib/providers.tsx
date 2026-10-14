"use client";

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider, App } from 'antd';
import { ReactNode, useState } from 'react';
import viVN from 'antd/locale/vi_VN'; // Sử dụng ngôn ngữ tiếng Việt mặc định

export default function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 phút
            refetchOnWindowFocus: false, // Tùy chọn refetch
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
            colorPrimary: '#1677FF', // eCommerce Electric Blue
            colorInfo: '#1677FF',
            colorLink: '#1677FF',
            colorTextBase: '#1D2129',
            colorBgBase: '#FFFFFF',
            borderRadius: 10,
            fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          },
          components: {
            Button: {
              borderRadius: 8,
              controlHeight: 40,
              fontWeight: 600,
            },
            Card: {
              borderRadiusLG: 14,
            },
            Input: {
              borderRadius: 8,
              controlHeight: 40,
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
