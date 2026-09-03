import { apiClient, fetchWithFallback } from './api.config';
import { Product } from '@/types';

const MOCK_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Pro Series Carbon T700',
    category: 'paddle',
    price: 3250000,
    oldPrice: 3800000,
    rating: 4.8,
    reviewsCount: 45,
    image: '/images/paddle.png',
    badge: 'Bán chạy',
    description: 'Vợt sợi Carbon Toray T700 mật độ cao kết hợp lõi tổ ong Polypropylene 16mm mang lại lực xoáy spin tối đa và độ kiểm soát bóng chuẩn xác.',
    sku: 'PK-CARBON-78',
    stock: 28,
  },
  {
    id: '2',
    name: 'Bóng PickleHub Tournament (Hộp 6 quả)',
    category: 'balls',
    price: 350000,
    oldPrice: 420000,
    rating: 5.0,
    reviewsCount: 120,
    image: '/images/balls.png',
    badge: 'Chuẩn USAPA',
    description: 'Bóng thi đấu ngoài trời 40 lỗ độ nảy chuẩn xác, chất liệu nhựa PE chịu nhiệt không nứt vỡ.',
    sku: 'PK-BALL-6PK',
    stock: 150,
  },
  {
    id: '3',
    name: 'Túi Đựng Vợt Premium PickleHub',
    category: 'bag',
    price: 700000,
    oldPrice: 900000,
    rating: 4.7,
    reviewsCount: 28,
    image: '/images/bag.png',
    badge: 'Chống nước',
    description: 'Balo thể thao đa năng chứa tới 3 vợt pickleball, ngăn cách giày cách nhiệt cao cấp.',
    sku: 'PK-BAG-PREMIUM',
    stock: 42,
  },
  {
    id: '4',
    name: 'Lưới Pickleball Di Động Tiêu Chuẩn',
    category: 'net',
    price: 1850000,
    oldPrice: 2200000,
    rating: 4.9,
    reviewsCount: 15,
    image: '/images/net.png',
    badge: 'Cao cấp',
    description: 'Bộ khung lưới khung thép sơn tĩnh điện gấp gọn tiêu chuẩn thi đấu quốc tế 6.7m.',
    sku: 'PK-NET-PORTABLE',
    stock: 10,
  },
];

export const productService = {
  async getProducts(category?: string, search?: string): Promise<Product[]> {
    return fetchWithFallback(async () => {
      const res = await apiClient.get('/products', { params: { category, search } });
      return res.data;
    }, category && category !== 'all' ? MOCK_PRODUCTS.filter(p => p.category === category) : MOCK_PRODUCTS);
  },

  async getProductById(id: string): Promise<Product> {
    return fetchWithFallback(async () => {
      const res = await apiClient.get(`/products/${id}`);
      return res.data;
    }, MOCK_PRODUCTS.find(p => p.id === id) || MOCK_PRODUCTS[0]);
  },
};
