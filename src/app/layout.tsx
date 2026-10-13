import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { Suspense } from "react";
import Providers from "@/lib/providers";

const font = Plus_Jakarta_Sans({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-main",
  display: "swap",
});

export const metadata: Metadata = {
  title: "E-Commerce - Mua sắm thông minh & Đẳng cấp",
  description: "Hệ thống mua sắm thương mại điện tử hiện đại, tiện lợi, uy tín và chất lượng cao.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={font.variable}>
      <body className={font.className}>
        <Suspense fallback={null}>
          <AntdRegistry>
            <Providers>
              {children}
            </Providers>
          </AntdRegistry>
        </Suspense>
      </body>
    </html>
  );
}
