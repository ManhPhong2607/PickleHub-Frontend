import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useCartStore } from './useCartStore';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: string;
  phoneNumber?: string;
  avatarUrl?: string;
  isEmailVerified?: boolean;
}

interface AuthState {
  user: UserProfile | null;
  token: string | null;
  isAuthModalOpen: boolean;
  authModalTab: 'login' | 'register' | 'forgot';
  setAuthModalOpen: (open: boolean, tab?: 'login' | 'register' | 'forgot') => void;
  setAuth: (user: UserProfile, token: string) => void;
  updateUser: (fields: Partial<UserProfile>) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthModalOpen: false,
      authModalTab: 'login',
      setAuthModalOpen: (open, tab = 'login') =>
        set({ isAuthModalOpen: open, authModalTab: tab }),
      setAuth: async (user, token) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('picklehub_token', token);
        }
        set({ user, token, isAuthModalOpen: false });

        // Tự động gộp giỏ hàng guest (nếu có) vào tài khoản vừa đăng nhập
        await useCartStore.getState().mergeGuestCartOnLogin();
      },
      updateUser: (fields) => {
        const current = get().user;
        if (current) {
          set({ user: { ...current, ...fields } });
        }
      },
      logout: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('picklehub_token');
        }
        set({ user: null, token: null });

        // Reset cart store & xóa sạch guest_cart local storage khi đăng xuất
        useCartStore.getState().resetOnLogout();
      },
    }),
    {
      name: 'picklehub_auth_storage',
      partialize: (state) => ({ user: state.user, token: state.token }),
    }
  )
);
