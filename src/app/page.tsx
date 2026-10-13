import React from 'react';
import HomeClient from './(shop)/HomeClient';

// Server Component: fetch sản phẩm trực tiếp từ BE khi render ở server
// → Không phải đợi JS bundle hydrate → loại bỏ ~1-2s delay
async function fetchInitialProducts() {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/products?page=0&size=12&sort=id,desc`,
      {
        next: { revalidate: 30 }, // ISR: cache 30 giây, tự động refresh nền
      }
    );
    if (!res.ok) return null;
    const raw = await res.json();
    // BE trả về { data: { content: [...], ... } } hoặc { content: [...], ... }
    const body = raw?.data ?? raw;
    if (Array.isArray(body)) {
      return { content: body, pageNumber: 0, pageSize: body.length, totalElements: body.length, totalPages: 1, last: true };
    }
    return {
      content: body.content ?? [],
      pageNumber: body.pageNumber ?? 0,
      pageSize: body.pageSize ?? 12,
      totalElements: body.totalElements ?? 0,
      totalPages: body.totalPages ?? 1,
      last: body.last ?? true,
    };
  } catch {
    return null;
  }
}

export default async function HomePage() {
  const initialProducts = await fetchInitialProducts();

  return <HomeClient initialProducts={initialProducts} />;
}
