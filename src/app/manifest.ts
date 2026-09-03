import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'PickleHub — Nền Tảng Dụng Cụ Pickleball Cao Cấp',
    short_name: 'PickleHub',
    description: 'Trang thiết bị vợt Pickleball Carbon T700, bóng thi đấu USAPA và phụ kiện chính hãng.',
    start_url: '/',
    id: '/',
    display: 'standalone',
    background_color: '#020617',
    theme_color: '#059669',
    orientation: 'portrait-primary',
    scope: '/',
    lang: 'vi',
    categories: ['shopping', 'sports'],
    icons: [
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
    shortcuts: [
      {
        name: 'Vợt Pickleball',
        short_name: 'Vợt',
        url: '/products?category=paddle',
        description: 'Khám phá các dòng vợt Pickleball Carbon T700',
      },
      {
        name: 'Giỏ hàng',
        short_name: 'Giỏ hàng',
        url: '/cart',
        description: 'Xem các sản phẩm đã chọn trong giỏ',
      },
      {
        name: 'Đơn hàng',
        short_name: 'Đơn hàng',
        url: '/orders',
        description: 'Theo dõi tình trạng đơn hàng của bạn',
      },
    ],
  };
}
