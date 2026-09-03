import { CategoriesModule } from '@/components/admin/CategoriesModule';

export const metadata = {
  title: 'Quản lý Danh mục | PickleHub Admin',
  description: 'Quản lý danh mục sản phẩm, hình ảnh và thuộc tính biến thể',
};

export default function AdminCategoriesPage() {
  return <CategoriesModule />;
}
