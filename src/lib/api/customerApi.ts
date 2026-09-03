import { apiClient, fetchWithFallback } from './client';

export interface CustomerAddressDto {
  id: string;
  fullName: string;
  phoneNumber: string;
  province: string;
  district: string;
  ward: string;
  streetAddress: string;
  isDefault: boolean;
}

export interface CreateAddressRequest {
  fullName: string;
  phoneNumber: string;
  province: string;
  district: string;
  ward: string;
  streetAddress: string;
  isDefault?: boolean;
}

export interface LoyaltyTierItemDto {
  id: string;
  name: string;
  minSpend: number;
  discountPercent: number;
  benefits: string[];
  isCurrentTier?: boolean;
  isAchieved?: boolean;
}

export interface LoyaltyDto {
  totalSpent: number;
  currentTierName?: string | null;
  currentDiscountPercent: number;
  nextTierName?: string | null;
  nextTierMinSpend?: number | null;
  amountNeededForNextTier?: number | null;
  allTiers: LoyaltyTierItemDto[];
}

export const customerApi = {
  /**
   * GET /customers/me/addresses → List of saved addresses for logged-in user
   */
  async getMyAddresses(): Promise<CustomerAddressDto[]> {
    return fetchWithFallback(async () => {
      const res = await apiClient.get<CustomerAddressDto[]>('/customers/me/addresses');
      return res.data || [];
    }, []);
  },

  /**
   * Alias for getMyAddresses
   */
  async getAddresses(): Promise<CustomerAddressDto[]> {
    return this.getMyAddresses();
  },

  /**
   * GET /customers/me → Get Customer Profile from CSDL
   */
  async getProfile(): Promise<any> {
    return fetchWithFallback(async () => {
      const res = await apiClient.get('/customers/me');
      return res.data;
    }, null);
  },

  /**
   * GET /customers/me/loyalty → Get Customer Loyalty Status from CSDL
   */
  async getLoyalty(): Promise<LoyaltyDto> {
    return fetchWithFallback(async () => {
      const res = await apiClient.get<LoyaltyDto>('/customers/me/loyalty');
      return res.data;
    }, {
      totalSpent: 0,
      currentTierName: 'Thành viên mới',
      currentDiscountPercent: 0,
      nextTierName: 'Rookie',
      nextTierMinSpend: 3000000,
      amountNeededForNextTier: 3000000,
      allTiers: [],
    });
  },

  /**
   * GET /loyalty-tiers → Get All Configured Loyalty Tiers
   */
  async getLoyaltyTiers(): Promise<LoyaltyTierItemDto[]> {
    return fetchWithFallback(async () => {
      const res = await apiClient.get<LoyaltyTierItemDto[]>('/loyalty-tiers');
      return res.data || [];
    }, []);
  },

  /**
   * PUT /customers/me → Update Customer Profile in CSDL
   */
  async updateProfile(data: { fullName: string; phoneNumber?: string }): Promise<any> {
    const res = await apiClient.put('/customers/me', data);
    return res.data;
  },

  /**
   * PATCH /auth/change-password → Change Password in CSDL
   */
  async changePassword(oldPassword: string, newPassword: string): Promise<any> {
    const res = await apiClient.patch('/auth/change-password', {
      oldPassword,
      newPassword,
    });
    return res.data;
  },

  /**
   * POST /customers/me/addresses → Add a new address
   */
  async addAddress(data: CreateAddressRequest): Promise<CustomerAddressDto> {
    const res = await apiClient.post<CustomerAddressDto>('/customers/me/addresses', data);
    return res.data;
  },

  /**
   * PUT /customers/me/addresses/{addressId} → Update existing address
   */
  async updateAddress(addressId: string, data: CreateAddressRequest): Promise<CustomerAddressDto> {
    const res = await apiClient.put<CustomerAddressDto>(`/customers/me/addresses/${addressId}`, data);
    return res.data;
  },

  /**
   * DELETE /customers/me/addresses/{addressId} → Delete saved address
   */
  async deleteAddress(addressId: string): Promise<void> {
    await apiClient.delete(`/customers/me/addresses/${addressId}`);
  },

  /**
   * PATCH /customers/me/addresses/{addressId}/set-default → Set as default address
   */
  async setDefaultAddress(addressId: string): Promise<CustomerAddressDto> {
    const res = await apiClient.patch<CustomerAddressDto>(`/customers/me/addresses/${addressId}/set-default`);
    return res.data;
  },
};
