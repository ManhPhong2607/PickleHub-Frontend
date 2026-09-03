import { apiClient, fetchWithFallback } from './client';

export const systemApi = {
  async getShippingFee(): Promise<number> {
    return fetchWithFallback(async () => {
      const res = await apiClient.get<{ key: string; value: string }>('/system/configs/shipping_fee_default');
      const val = Number(res.data?.value);
      return isNaN(val) ? 0 : val;
    }, 0);
  },
};
