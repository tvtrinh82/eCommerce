import { apiClient } from '@/lib/api-client';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
dayjs.extend(isBetween);
dayjs.extend(isSameOrBefore);

// Hàm helper lấy toàn bộ đơn hàng
export const fetchAllOrders = async () => {
  try {
    const res: any = await apiClient.get('/orders?page=0&size=1000');
    return res?.data?.content || res?.data || [];
  } catch {
    return [];
  }
};

// Hàm helper lấy toàn bộ sản phẩm
export const fetchAllProducts = async () => {
  try {
    const res: any = await apiClient.get('/products?page=0&size=1000');
    return res?.data?.content || res?.data || [];
  } catch {
    return [];
  }
};

export const dashboardApi = {
  // Các hàm cũ của bạn
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
    statuses.forEach((s) => (counts[s] = 0));

    orders.forEach((order: any) => {
      const orderDate = dayjs(order.createdAt).format('YYYY-MM-DD');
      if (orderDate === targetDate && counts[order.status] !== undefined) {
        counts[order.status]++;
      }
    });
    return statuses.map((status) => ({ status, count: counts[status] }));
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
    return Object.keys(productSales)
      .map((pid) => {
        const p = products.find((x: any) => x.id === Number(pid));
        return {
          id: Number(pid),
          name: p?.name || `Sản phẩm #${pid}`,
          sold: productSales[Number(pid)],
          price: p?.price || 0,
        };
      })
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 5);
  },

  getLowStock: async (_date?: string) => {
    const products = await fetchAllProducts();
    return products
      .filter((p: any) => p.status === 'ACTIVE' && p.stock <= 5)
      .sort((a: any, b: any) => a.stock - b.stock)
      .map((p: any) => ({
        id: p.id,
        name: p.name,
        stock: p.stock,
        price: p.price,
      }));
  },

  // Các hàm mới phục vụ giao diện Dashboard eCommerce
  getSummaryStats: async () => {
    const [orders, products] = await Promise.all([
      fetchAllOrders(),
      fetchAllProducts(),
    ]);

    const todayStr = dayjs().format('YYYY-MM-DD');
    let revenueToday = 0;
    let pendingOrders = 0;
    let totalStock = 0;

    products.forEach((p: any) => {
      totalStock += p.stock || 0;
    });

    orders.forEach((o: any) => {
      const orderDate = dayjs(o.createdAt).format('YYYY-MM-DD');
      if (orderDate === todayStr) {
        if (o.paymentStatus === 'PAID' || ['CONFIRMED', 'COMPLETED'].includes(o.status)) {
          revenueToday += o.totalAmount || 0;
        }
      }
      if (o.status === 'PENDING' || o.status === 'AWAITING_PAYMENT') {
        pendingOrders++;
      }
    });

    return {
      revenueToday,
      totalProducts: products.length,
      totalStock,
      totalOrders: orders.length,
      pendingOrders,
    };
  },

  getOverallSalesChart: async (filter: 'Daily' | 'Weekly' | 'Monthly') => {
    const orders = await fetchAllOrders();
    const result: Array<{ label: string; count: number; revenue: number }> = [];

    if (filter === 'Monthly') {
      for (let i = 7; i >= 0; i--) {
        const monthObj = dayjs().subtract(i, 'month');
        const monthLabel = monthObj.format('MMM');
        const monthStr = monthObj.format('YYYY-MM');

        let count = 0;
        let revenue = 0;
        orders.forEach((o: any) => {
          if (dayjs(o.createdAt).format('YYYY-MM') === monthStr) {
            count++;
            revenue += o.totalAmount || 0;
          }
        });
        result.push({ label: monthLabel, count, revenue });
      }
    } else if (filter === 'Weekly') {
      for (let i = 6; i >= 0; i--) {
        const startWeek = dayjs().subtract(i, 'week').startOf('week');
        const endWeek = dayjs().subtract(i, 'week').endOf('week');
        const label = `W${startWeek.format('w')}`;

        let count = 0;
        let revenue = 0;
        orders.forEach((o: any) => {
          const d = dayjs(o.createdAt);
          if (d.isBetween(startWeek, endWeek, null, '[]')) {
            count++;
            revenue += o.totalAmount || 0;
          }
        });
        result.push({ label, count, revenue });
      }
    } else {
      for (let i = 6; i >= 0; i--) {
        const dayObj = dayjs().subtract(i, 'day');
        const label = dayObj.format('DD/MM');
        const dayStr = dayObj.format('YYYY-MM-DD');

        let count = 0;
        let revenue = 0;
        orders.forEach((o: any) => {
          if (dayjs(o.createdAt).format('YYYY-MM-DD') === dayStr) {
            count++;
            revenue += o.totalAmount || 0;
          }
        });
        result.push({ label, count, revenue });
      }
    }

    return result;
  },

  getOrderDistribution: async () => {
    const orders = await fetchAllOrders();
    const total = orders.length || 1;

    let completed = 0;
    let pending = 0;
    let cancelled = 0;

    orders.forEach((o: any) => {
      if (['COMPLETED', 'PAID', 'CONFIRMED'].includes(o.status)) {
        completed++;
      } else if (o.status === 'CANCELLED') {
        cancelled++;
      } else {
        pending++;
      }
    });

    return {
      completedRate: Math.round((completed / total) * 100),
      pendingRate: Math.round((pending / total) * 100),
      cancelledRate: Math.round((cancelled / total) * 100),
      totalOrders: orders.length,
    };
  },

  getLatestTransactions: async (limit = 4) => {
    const orders = await fetchAllOrders();
    const sorted = [...orders].sort(
      (a: any, b: any) => dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf()
    );

    return sorted.slice(0, limit).map((o: any) => {
      const firstItem = o.items?.[0];
      return {
        id: `#${o.id || o.code || '8764'}`,
        productName: firstItem?.product?.name || firstItem?.name || `Đơn hàng #${o.id}`,
        date: dayjs(o.createdAt || new Date()).format('DD/MM/YYYY'),
        price: firstItem?.price ? `${firstItem.price.toLocaleString('vi-VN')} đ` : '-',
        quantity: o.items?.reduce((sum: number, it: any) => sum + (it.quantity || 1), 0) || 1,
        totalAmount: `${(o.totalAmount || 0).toLocaleString('vi-VN')} đ`,
        rawId: o.id,
      };
    });
  },

  getRecentCustomers: async (limit = 4) => {
    const orders = await fetchAllOrders();
    const sorted = [...orders].sort(
      (a: any, b: any) => dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf()
    );

    const customersMap = new Map();
    for (const o of sorted) {
      const customer = o.customer || o.user;
      const key = customer?.id || o.customerName || o.shippingAddress?.fullName || 'Khách vãng lai';
      if (!customersMap.has(key)) {
        customersMap.set(key, {
          name: customer?.name || customer?.fullName || o.customerName || 'Khách hàng',
          time: dayjs(o.createdAt).format('HH:mm DD/MM'),
          code: `KH${customer?.id || o.id}`,
        });
      }
      if (customersMap.size >= limit) break;
    }

    return Array.from(customersMap.values());
  },
};