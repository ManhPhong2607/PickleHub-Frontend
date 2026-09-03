import { apiClient, fetchWithFallback } from './client';
import { PaymentRequest, PaymentResponse } from '@/types';

export const paymentApi = {
  async createPaymentLink(request: PaymentRequest): Promise<PaymentResponse> {
    return fetchWithFallback(async () => {
      const res = await apiClient.post('/payments/create-link', request);
      return res.data;
    }, {
      paymentId: 'pay-888',
      orderId: request.orderId,
      amount: request.amount,
      checkoutUrl: 'https://pay.payos.vn/web/123456',
      qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=00020101021238580010A000000727012800069704180114000000000000000208QRIBFTTA53037045407${request.amount}5802VN5909PickleHub`,
      status: 'PENDING',
    });
  },
};
