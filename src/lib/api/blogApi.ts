import { apiClient } from './client';

export interface PostCategoryDto {
  id: string;
  name: string;
  slug: string;
  description?: string;
  displayOrder: number;
}

export interface PostListDto {
  id: string;
  title: string;
  slug: string;
  summary?: string;
  coverImageUrl?: string;
  categoryName: string;
  categorySlug?: string;
  status?: string;
  publishedAt?: string;
  viewCount: number;
}

export interface RelatedProductDto {
  id: string;
  name: string;
  slug: string;
  basePrice?: number;
  price?: number;
  effectivePrice?: number;
  salePercent?: number;
  imageUrl?: string;
  image?: string;
  thumbnailUrl?: string;
  images?: string[];
  categoryName?: string;
  brandName?: string;
}

export interface AdjacentPostDto {
  title: string;
  slug: string;
}

export interface PostDetailDto {
  id: string;
  title: string;
  slug: string;
  summary?: string;
  content: string;
  coverImageUrl?: string;
  categoryId: string;
  categoryName: string;
  status: string;
  publishedAt?: string;
  authorId: string;
  viewCount: number;
  seoTitle?: string;
  seoDescription?: string;
  relatedProductIds?: string[];
  relatedProducts?: RelatedProductDto[];
  previousPost?: AdjacentPostDto;
  nextPost?: AdjacentPostDto;
}

export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
}

export interface CreatePostDto {
  title: string;
  content: string;
  categoryId: string;
  summary?: string;
  seoTitle?: string;
  seoDescription?: string;
  relatedProductIds?: string[];
}

export interface UpdatePostDto {
  title: string;
  content: string;
  categoryId: string;
  summary?: string;
  seoTitle?: string;
  seoDescription?: string;
  relatedProductIds?: string[];
}

export const blogApi = {
  // Public APIs
  async getPosts(params?: { keyword?: string; categorySlug?: string; page?: number; pageSize?: number }): Promise<PagedResult<PostListDto>> {
    const res = await apiClient.get<PagedResult<PostListDto>>('/posts', { params });
    return res.data;
  },

  async getPostBySlug(slug: string): Promise<PostDetailDto> {
    const res = await apiClient.get<PostDetailDto>(`/posts/${encodeURIComponent(slug)}`);
    return res.data;
  },

  async getRelatedPosts(slug: string, limit: number = 4): Promise<PostListDto[]> {
    const res = await apiClient.get<PostListDto[]>(`/posts/${encodeURIComponent(slug)}/related`, {
      params: { limit },
    });
    return res.data;
  },

  async getCategories(): Promise<PostCategoryDto[]> {
    const res = await apiClient.get<PostCategoryDto[]>('/post-categories');
    return res.data;
  },

  // Admin APIs
  async getAdminPosts(params?: { keyword?: string; status?: string; categoryId?: string; page?: number; pageSize?: number }): Promise<PagedResult<PostListDto>> {
    const res = await apiClient.get<PagedResult<PostListDto>>('/admin/posts', { params });
    return res.data;
  },

  async getAdminPostById(id: string): Promise<PostDetailDto> {
    const res = await apiClient.get<PostDetailDto>(`/admin/posts/${id}`);
    return res.data;
  },

  async createPost(dto: CreatePostDto): Promise<PostDetailDto> {
    const res = await apiClient.post<PostDetailDto>('/admin/posts', dto);
    return res.data;
  },

  async updatePost(id: string, dto: UpdatePostDto): Promise<PostDetailDto> {
    const res = await apiClient.put<PostDetailDto>(`/admin/posts/${id}`, dto);
    return res.data;
  },

  async publishPost(id: string): Promise<void> {
    await apiClient.put(`/admin/posts/${id}/publish`);
  },

  async archivePost(id: string): Promise<void> {
    await apiClient.put(`/admin/posts/${id}/archive`);
  },

  async deletePost(id: string): Promise<void> {
    await apiClient.delete(`/admin/posts/${id}`);
  },

  async uploadCoverImage(id: string, file: File): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await apiClient.post<{ url: string }>(`/admin/posts/${id}/cover-image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  // Upload ?nh ho?c video d? nh�ng tr?c ti?p v�o n?i dung b�i vi?t
  async uploadInlineMedia(file: File): Promise<{ url: string; resourceType: string }> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await apiClient.post<{ url: string; resourceType: string }>('/admin/posts/upload-media', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  async createCategory(data: { name: string; description?: string; displayOrder?: number }): Promise<PostCategoryDto> {
    const res = await apiClient.post<PostCategoryDto>('/post-categories', data);
    return res.data;
  },

  async updateCategory(id: string, data: { name: string; description?: string; displayOrder?: number }): Promise<PostCategoryDto> {
    const res = await apiClient.put<PostCategoryDto>(`/post-categories/${id}`, data);
    return res.data;
  },

  async deleteCategory(id: string): Promise<void> {
    await apiClient.delete(`/post-categories/${id}`);
  },
};
