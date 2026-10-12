import { apiClient } from '@/lib/api-client';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
dayjs.extend(isBetween);
dayjs.extend(isSameOrBefore);

// Hàm helper lấy toàn bộ đơn hàng
export const fetchAllOrders = async () => {
  const res: any = await apiClient.get('/orders?page=0&size=1000');
  return res?.data?.content || res?.data || [];
};

// Hàm helper lấy toàn bộ sản phẩm
export const fetchAllProducts = async () => {
  const res: any = await apiClient.get('/products?page=0&size=1000');
  return res?.data?.content || res?.data || [];
};

export const dashboardApi = {
  getDailyRevenue: async (date: string) => {
    const orders = await fetchAllOrders();
    const targetDate = dayjs(date).format('YYYY-MM-DD');

    let revenue = 0;
    orders.forEach((order: any) => {
      const orderDate = dayjs(order.createdAt).format('YYYY-MM-DD');
      if (orderDate === targetDate) {
        if (order.paymentStatus === 'PAID' || ['CONFIRMED', 'COMPLETED'].includes(order.status)) {
          revenue += order.totalAmount || 0;
        }
      }
    });

    return { revenue, date };
  },

  getOrderStats: async (date: string) => {
    const orders = await fetchAllOrders();
    const targetDate = dayjs(date).format('YYYY-MM-DD');

    const statuses = ['PENDING', 'AWAITING_PAYMENT', 'PAID', 'CONFIRMED', 'COMPLETED', 'CANCELLED'];
    const counts: Record<string, number> = {};
    statuses.forEach(s => counts[s] = 0);

    orders.forEach((order: any) => {
      const orderDate = dayjs(order.createdAt).format('YYYY-MM-DD');
      if (orderDate === targetDate) {
        if (counts[order.status] !== undefined) {
          counts[order.status]++;
        }
      }
    });

    return statuses.map(status => ({ status, count: counts[status] }));
  },

  getTopProducts: async (date: string) => {
    const orders = await fetchAllOrders();
    const endDate = dayjs(date).endOf('day');
    const startDate = dayjs(date).subtract(30, 'day').startOf('day');

    const productSales: Record<number, number> = {};

    orders.forEach((order: any) => {
      const orderDate = dayjs(order.createdAt);
      if (orderDate.isBetween(startDate, endDate, null, '[]')) {
        order.items?.forEach((item: any) => {
          const pid = item.productId || item.product?.id;
          if (pid) {
            productSales[pid] = (productSales[pid] || 0) + item.quantity;
          }
        });
      }
    });

    const products = await fetchAllProducts();
    const topProducts = Object.keys(productSales)
      .map(pid => {
        const p = products.find((x: any) => x.id === Number(pid));
        return {
          id: Number(pid),
          name: p?.name || `Sản phẩm #${pid}`,
          sold: productSales[Number(pid)],
          price: p?.price || 0
        };
      })
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 5);

    return topProducts;
  },

  getLowStock: async (date: string) => {
    const products = await fetchAllProducts();
    // Lọc các sản phẩm đang bán (ACTIVE) và tồn kho <= 5
    return products
      .filter((p: any) => p.status === 'ACTIVE' && p.stock <= 5)
      .sort((a: any, b: any) => a.stock - b.stock)
      .map((p: any) => ({
        id: p.id,
        name: p.name,
        stock: p.stock,
        price: p.price
      }));
  }
};
