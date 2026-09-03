import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product } from '@/types';

interface WishlistState {
  items: Product[];
  toggleWishlist: (product: Product) => void;
  isInWishlist: (productId: string) => boolean;
  clearWishlist: () => void;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      toggleWishlist: (product) => {
        const current = get().items;
        const exists = current.some((p) => p.id === product.id);
        if (exists) {
          set({ items: current.filter((p) => p.id !== product.id) });
        } else {
          set({ items: [...current, product] });
        }
      },
      isInWishlist: (productId) => get().items.some((p) => p.id === productId),
      clearWishlist: () => set({ items: [] }),
    }),
    {
      name: 'picklehub_wishlist_storage',
    }
  )
);
