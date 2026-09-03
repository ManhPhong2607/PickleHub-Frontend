import { useCartStore as mainUseCartStore, CartItem as MainCartItem } from '@/store/useCartStore';

export type CartItem = MainCartItem;

export const useCartStore = mainUseCartStore;
