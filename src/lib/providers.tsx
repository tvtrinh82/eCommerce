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
            colorPrimary: '#18181b', // Đen trầm sang trọng (thay cho xanh dương cũ)
            colorInfo: '#27272a',
            colorTextBase: '#18181b',
            colorBgBase: '#ffffff',
            borderRadius: 8,
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
