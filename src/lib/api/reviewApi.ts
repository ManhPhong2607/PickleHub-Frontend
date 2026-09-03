import { apiClient, fetchWithFallback } from './client';
import { ProductRatingSummary, ReviewDto } from '@/types';

export const reviewApi = {
  async getRatingSummary(productId: string): Promise<ProductRatingSummary> {
    return fetchWithFallback(async () => {
      const res = await apiClient.get(`/reviews/product/${productId}/summary`);
      return res.data;
    }, {
      productId,
      averageRating: 5.0,
      totalReviews: 1,
      starDistribution: {
        fiveStar: 1,
        fourStar: 0,
        threeStar: 0,
        twoStar: 0,
        oneStar: 0,
      },
    });
  },

  async getProductReviews(productId: string): Promise<ReviewDto[]> {
    return fetchWithFallback(async () => {
      const res = await apiClient.get(`/reviews/product/${productId}`);
      return res.data.items || res.data;
    }, []);
  },

  async getMyReviews(): Promise<ReviewDto[]> {
    return fetchWithFallback(async () => {
      const res = await apiClient.get('/reviews/me');
      return res.data.items || res.data;
    }, []);
  },

  async createReview(data: { productId: string; orderId: string; rating: number; comment: string; imageUrls?: string[] }): Promise<ReviewDto> {
    const res = await apiClient.post('/reviews', data);
    return res.data;
  },

  async getUploadSignature(orderId: string = '', productId: string = ''): Promise<{ cloudName: string; apiKey: string; timestamp: number; signature: string; folder: string }> {
    const res = await apiClient.get('/reviews/upload-signature', { params: { orderId, productId } });
    return res.data;
  },

  async uploadSignedImage(file: File, signatureData: { cloudName: string; apiKey: string; timestamp: number; signature: string; folder: string }): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', signatureData.apiKey);
    formData.append('timestamp', signatureData.timestamp.toString());
    formData.append('signature', signatureData.signature);
    formData.append('folder', signatureData.folder);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${signatureData.cloudName}/image/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      throw new Error(errJson.error?.message || 'Tải ảnh lên Cloudinary thất bại.');
    }

    const data = await response.json();
    return data.secure_url;
  },

  async toggleHideReview(reviewId: string, hideReason?: string): Promise<void> {
    await apiClient.patch(`/reviews/${reviewId}/hide`, { hideReason });
  },

  async replyReview(reviewId: string, replyContent: string): Promise<void> {
    await apiClient.patch(`/reviews/${reviewId}/reply`, { replyContent });
  },
};
