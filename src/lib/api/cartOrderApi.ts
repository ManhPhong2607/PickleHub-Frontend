import { apiClient, fetchWithFallback } from './client';
import { Cart, CartItem, Order, OrderStatus } from '@/types';

export const cartOrderApi = {
  async getCart(sessionId: string): Promise<any> {
    return fetchWithFallback(async () => {
      const res = await apiClient.get('/cart', { params: { sessionId } });
      return res.data;
    }, {
      id: 'cart-1',
      sessionId,
      items: [],
      subtotal: 0,
    });
  },

  async addToCart(sessionId: string, productVariantId: string, quantity: number): Promise<any> {
    return fetchWithFallback(async () => {
      const res = await apiClient.post('/cart/items', { sessionId, productVariantId, quantity });
      return res.data;
    }, null);
  },

  async updateItemQuantity(itemId: string, quantity: number): Promise<any> {
    return fetchWithFallback(async () => {
      const res = await apiClient.put(`/cart/items/${itemId}`, { quantity });
      return res.data;
    }, null);
  },

  async removeItem(itemId: string): Promise<any> {
    return fetchWithFallback(async () => {
      const res = await apiClient.delete(`/cart/items/${itemId}`);
      return res.data;
    }, null);
  },

  async mergeCart(sessionId?: string, guestItems?: any[]): Promise<any> {
    return fetchWithFallback(async () => {
      const res = await apiClient.post('/cart/merge', { sessionId, guestItems });
      return res.data;
    }, null);
  },

  async checkoutOrder(orderData: Partial<Order>): Promise<Order> {
    return fetchWithFallback(async () => {
      const res = await apiClient.post('/orders', orderData);
      return res.data;
    }, {
      id: '7c94e97a-1234-5678-90ab-cdef12345678',
      userId: 'user-999',
      customerName: orderData.customerName || 'Nguyen Van A',
      customerPhone: orderData.customerPhone || '0901234567',
      shippingAddress: orderData.shippingAddress || '123 Le Loi, Quan 1, TP.HCM',
      status: 'Confirmed',
      totalAmount: orderData.totalAmount || 3250000,
      paymentMethod: orderData.paymentMethod || 'PayOS',
      trackingNumber: 'GHTK-982173',
      items: [],
      createdAt: new Date().toISOString(),
    });
  },

  async checkout(orderData: any): Promise<any> {
    const res = await apiClient.post('/orders', orderData);
    return res.data;
  },

  async createPaymentLink(orderId: string, amount: number): Promise<{ paymentLinkId?: string; checkoutUrl?: string; orderCode?: number; qrCode?: string } | null> {
    return fetchWithFallback(async () => {
      const res = await apiClient.post('/payments/create-link', { orderId, amount });
      return res.data;
    }, null);
  },

  async checkPaymentStatus(orderId: string): Promise<{ isPaid: boolean; status: string }> {
    return fetchWithFallback(async () => {
      const res = await apiClient.get(`/payments/status/${orderId}`);
      return res.data;
    }, { isPaid: false, status: 'Pending' });
  },

  async cancelMyOrder(orderId: string, reason?: string): Promise<void> {
    return fetchWithFallback(async () => {
      await apiClient.patch(`/orders/me/${orderId}/cancel`, { reason });
    }, undefined);
  },

  async getMyOrders(): Promise<any[]> {
    return fetchWithFallback(async () => {
      const res = await apiClient.get('/orders/me');
      return res.data;
    }, []);
  },

  async getMyOrderById(orderId: string): Promise<any> {
    return fetchWithFallback(async () => {
      const res = await apiClient.get(`/orders/me/${orderId}`);
      return res.data;
    }, null);
  },
};
