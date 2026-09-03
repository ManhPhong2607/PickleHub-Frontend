import { useQuery } from '@tanstack/react-query';
import { productService } from '@/services/product.service';

export function useProducts(category?: string, search?: string) {
  return useQuery({
    queryKey: ['products', category, search],
    queryFn: () => productService.getProducts(category, search),
  });
}

export function useProductDetail(id: string) {
  return useQuery({
    queryKey: ['product', id],
    queryFn: () => productService.getProductById(id),
    enabled: !!id,
  });
}
