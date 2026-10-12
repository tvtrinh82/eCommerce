import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../api';

export const useDailyRevenue = (date: string) => {
  return useQuery({
    queryKey: ['dashboard', 'revenue', date],
    queryFn: () => dashboardApi.getDailyRevenue(date),
  });
};

export const useOrderStats = (date: string) => {
  return useQuery({
    queryKey: ['dashboard', 'orderStats', date],
    queryFn: () => dashboardApi.getOrderStats(date),
  });
};

export const useTopProducts = (date: string) => {
  return useQuery({
    queryKey: ['dashboard', 'topProducts', date],
    queryFn: () => dashboardApi.getTopProducts(date),
  });
};

export const useLowStockProducts = (date: string) => {
  return useQuery({
    queryKey: ['dashboard', 'lowStock', date],
    queryFn: () => dashboardApi.getLowStock(date),
  });
};
