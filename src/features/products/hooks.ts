import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productApi } from './api';
import { ProductPayload, Product } from './types';

export const useProducts = (params: any = {}) => {
  return useQuery({
    queryKey: ['products', params],
    queryFn: async () => {
      // Ant Design UI dùng page bắt đầu từ 1, nhưng Spring Boot BE yêu cầu page bắt đầu từ 0
      const apiParams = { 
        ...params, 
        keyword: params.name,
        page: params.page ? Number(params.page) - 1 : 0 
      };
      delete apiParams.name;
      const response: any = await productApi.getProducts(apiParams);
      // Giả sử API trả về định dạng phân trang Spring Boot: { content: [], totalElements: ... }
      return response.data;
    }
  });
};

export const useCreateProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ProductPayload) => productApi.createProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    }
  });
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ProductPayload }) => productApi.updateProduct(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    }
  });
};

export const useDeleteProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => productApi.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    }
  });
};
