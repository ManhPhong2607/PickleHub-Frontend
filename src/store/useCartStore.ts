import { create } from 'zustand';
import { Product } from '@/types';
import { cartOrderApi } from '@/lib/api/cartOrderApi';

export interface CartItem {
  id: string;
  dbItemId?: string;
  product: Product;
  variantId?: string;
  variantName?: string;
  price: number;
  quantity: number;
  selected?: boolean;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  sessionId: string;
  setIsOpen: (open: boolean) => void;
  addItem: (product: Product, variantId?: string, variantName?: string, price?: number, quantity?: number) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  toggleSelectItem: (id: string) => void;
  toggleSelectAll: () => void;
  clearCart: () => void;
  clearSelected: () => void;
  restoreCart: (items: CartItem[]) => Promise<void>;
  loadCart: () => Promise<void>;
  mergeGuestCartOnLogin: () => Promise<void>;
  resetOnLogout: () => void;
  getTotalItems: () => number;
  getSelectedItemsCount: () => number;
  getSubtotal: () => number;
  getSelectedSubtotal: () => number;
  getSelectedItems: () => CartItem[];
}

const GUEST_CART_KEY = 'guest_cart';

function isAuthed(): boolean {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem('picklehub_token');
}

function getGuestCartFromStorage(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(GUEST_CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveGuestCartToStorage(items: CartItem[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
  } catch (err) {
    console.warn('[useCartStore] save guest_cart error:', err);
  }
}

function clearGuestCartStorage() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(GUEST_CART_KEY);
}

function ensureGuid(id: string): string {
  const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (guidRegex.test(id)) return id;
  const hex = Array.from(id).map((c) => c.charCodeAt(0).toString(16)).join('').padEnd(12, '0').substring(0, 12);
  return `00000000-0000-4000-8000-${hex}`;
}

function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return 'session-default';
  let sessionId = localStorage.getItem('picklehub_cart_session_id');
  if (!sessionId) {
    sessionId = 'session_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
    localStorage.setItem('picklehub_cart_session_id', sessionId);
  }
  return sessionId;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  isOpen: false,
  sessionId: typeof window !== 'undefined' ? getOrCreateSessionId() : 'session-default',

  setIsOpen: (open) => set({ isOpen: open }),

  addItem: (product, variantId, variantName, price, quantity = 1) => {
    const currentItems = get().items;
    const itemId = variantId ? `${product.id}-${variantId}` : product.id;
    const itemPrice = price ?? product.price;

    const existingIndex = currentItems.findIndex((item) => item.id === itemId);
    let updatedItems: CartItem[];

    if (existingIndex > -1) {
      updatedItems = [...currentItems];
      updatedItems[existingIndex].quantity += quantity;
      updatedItems[existingIndex].selected = true;
    } else {
      updatedItems = [
        ...currentItems,
        {
          id: itemId,
          product,
          variantId,
          variantName,
          price: itemPrice,
          quantity,
          selected: true,
        },
      ];
    }

    set({ items: updatedItems, isOpen: true });

    if (!isAuthed()) {
      // 1. CHƯA ĐĂNG NHẬP: Lưu toàn bộ vào guest_cart trong localStorage
      saveGuestCartToStorage(updatedItems);
    } else {
      // 2. ĐÃ ĐĂNG NHẬP: Gọi trực tiếp API server theo JWT User
      const targetVariantId = ensureGuid(variantId || product.id);
      cartOrderApi
        .addToCart('', targetVariantId, quantity)
        .then((cartDto) => {
          if (cartDto && Array.isArray(cartDto.items)) {
            const matchedDbItem = cartDto.items.find(
              (i: any) => i.productVariantId === targetVariantId || i.productId === targetVariantId
            );
            if (matchedDbItem) {
              set({
                items: get().items.map((it) =>
                  it.id === itemId ? { ...it, dbItemId: matchedDbItem.id } : it
                ),
              });
            }
          }
        })
        .catch((err) => {
          console.warn('[CartStore] logged-in addToCart warning:', err);
        });
    }
  },

  removeItem: (id) => {
    const itemToRemove = get().items.find((item) => item.id === id);
    const remaining = get().items.filter((item) => item.id !== id);
    set({ items: remaining });

    if (!isAuthed()) {
      saveGuestCartToStorage(remaining);
    } else if (itemToRemove && itemToRemove.dbItemId) {
      cartOrderApi.removeItem(itemToRemove.dbItemId).catch((err) => {
        console.warn('[CartStore] logged-in removeItem warning:', err);
      });
    }
  },

  updateQuantity: (id, quantity) => {
    if (quantity <= 0) {
      get().removeItem(id);
      return;
    }

    const itemToUpdate = get().items.find((item) => item.id === id);
    const updated = get().items.map((item) => (item.id === id ? { ...item, quantity } : item));
    set({ items: updated });

    if (!isAuthed()) {
      saveGuestCartToStorage(updated);
    } else if (itemToUpdate && itemToUpdate.dbItemId) {
      cartOrderApi.updateItemQuantity(itemToUpdate.dbItemId, quantity).catch((err) => {
        console.warn('[CartStore] logged-in updateQuantity warning:', err);
      });
    }
  },

  toggleSelectItem: (id) => {
    const updated = get().items.map((item) =>
      item.id === id ? { ...item, selected: item.selected === false ? true : false } : item
    );
    set({ items: updated });
    if (!isAuthed()) saveGuestCartToStorage(updated);
  },

  toggleSelectAll: () => {
    const currentItems = get().items;
    const allSelected = currentItems.length > 0 && currentItems.every((i) => i.selected !== false);
    const updated = currentItems.map((item) => ({ ...item, selected: !allSelected }));
    set({ items: updated });
    if (!isAuthed()) saveGuestCartToStorage(updated);
  },

  clearCart: () => {
    const currentItems = get().items;
    set({ items: [] });

    if (!isAuthed()) {
      clearGuestCartStorage();
    } else {
      currentItems.forEach((item) => {
        const dbId = item.dbItemId || ensureGuid(item.variantId || item.product?.id || item.id);
        cartOrderApi.removeItem(dbId).catch(() => {});
      });
    }
  },

  clearSelected: () => {
    const currentItems = get().items;
    const selectedItems = currentItems.filter((i) => i.selected !== false);
    const remainingItems = currentItems.filter((i) => i.selected === false);
    set({ items: remainingItems });

    if (!isAuthed()) {
      saveGuestCartToStorage(remainingItems);
    } else {
      selectedItems.forEach((item) => {
        const dbId = item.dbItemId || ensureGuid(item.variantId || item.product?.id || item.id);
        cartOrderApi.removeItem(dbId).catch(() => {});
      });
    }
  },

  restoreCart: async (itemsToRestore: CartItem[]) => {
    if (!itemsToRestore || itemsToRestore.length === 0) return;
    set({ items: itemsToRestore });

    if (!isAuthed()) {
      saveGuestCartToStorage(itemsToRestore);
    } else {
      try {
        for (const item of itemsToRestore) {
          const targetVariantId = ensureGuid(item.variantId || item.product?.id || item.id);
          await cartOrderApi.addToCart('', targetVariantId, item.quantity).catch(() => {});
        }
        await get().loadCart();
      } catch (err) {
        console.warn('[CartStore] restoreCart error:', err);
      }
    }
  },

  loadCart: async () => {
    if (!isAuthed()) {
      // 1. Khách chưa đăng nhập: Đọc duy nhất từ key guest_cart
      const guestItems = getGuestCartFromStorage();
      set({ items: guestItems });
    } else {
      // 2. Đã đăng nhập: Đọc trực tiếp từ server GET /cart/me (JWT Authorized)
      try {
        const dbCart = await cartOrderApi.getCart('');
        if (dbCart && Array.isArray(dbCart.items)) {
          const syncedItems: CartItem[] = dbCart.items.map((i: any) => ({
            id: i.productVariantId || i.productId || i.id,
            dbItemId: i.id,
            product: {
              id: i.productId || i.productVariantId,
              name: i.productNameSnapshot || i.name || 'Sản phẩm',
              price: i.unitPrice || i.price || 0,
              image: i.imageUrlSnapshot || i.image || '/images/paddle.png',
              category: 'paddle',
              description: '',
              rating: 5,
              reviewsCount: 10,
              inStock: true,
            },
            variantId: i.productVariantId,
            variantName: i.variantAttributesSnapshot || '',
            price: i.unitPrice || i.price || 0,
            quantity: i.quantity || 1,
            selected: true,
          }));

          set({ items: syncedItems });
        }
      } catch (err) {
        console.warn('[CartStore] loadCart server fetch error:', err);
      }
    }
  },

  mergeGuestCartOnLogin: async () => {
    const guestItems = getGuestCartFromStorage();
    const currentMemoryItems = get().items;
    const itemsToMerge = guestItems.length > 0 ? guestItems : currentMemoryItems;

    // Lưu lại trạng thái tích chọn (selected) của từng món hàng trước khi đăng nhập
    const selectedMap: Record<string, boolean> = {};
    itemsToMerge.forEach((item) => {
      const key = item.variantId || item.product.id || item.id;
      selectedMap[key] = item.selected !== false;
    });
    const hasExplicitSelection = itemsToMerge.some((i) => i.selected === false);

    const sessionId = get().sessionId || getOrCreateSessionId();

    try {
      if (itemsToMerge.length > 0) {
        const payloadItems = itemsToMerge.map((item) => ({
          productId: ensureGuid(item.product.id),
          productVariantId: ensureGuid(item.variantId || item.product.id),
          quantity: item.quantity,
          variantName: item.variantName || '',
        }));

        const mergedCart = await cartOrderApi.mergeCart(sessionId, payloadItems);

        if (mergedCart && Array.isArray(mergedCart.items) && mergedCart.items.length > 0) {
          const syncedItems: CartItem[] = mergedCart.items.map((i: any) => {
            const vKey = i.productVariantId || i.productId || i.id;
            // Nếu sản phẩm đó trước khi đăng nhập không được tích chọn, giữ nguyên false
            const isSelected = hasExplicitSelection ? (selectedMap[vKey] ?? false) : true;
            return {
              id: vKey,
              dbItemId: i.id,
              product: {
                id: i.productId || i.productVariantId,
                name: i.productNameSnapshot || i.name || 'Sản phẩm',
                price: i.unitPrice || i.price || 0,
                image: i.imageUrlSnapshot || i.image || '/images/paddle.png',
                category: 'paddle',
                description: '',
                rating: 5,
                reviewsCount: 10,
                inStock: true,
              },
              variantId: i.productVariantId,
              variantName: i.variantAttributesSnapshot || '',
              price: i.unitPrice || i.price || 0,
              quantity: i.quantity || 1,
              selected: isSelected,
            };
          });

          set({ items: syncedItems });
        } else {
          await get().loadCart();
        }
      } else {
        await get().loadCart();
      }

      clearGuestCartStorage();
    } catch (err) {
      console.warn('[CartStore] mergeGuestCartOnLogin error:', err);
      if (itemsToMerge.length > 0 && get().items.length === 0) {
        set({ items: itemsToMerge });
      } else {
        await get().loadCart();
      }
      clearGuestCartStorage();
    }
  },

  resetOnLogout: () => {
    clearGuestCartStorage();
    set({ items: [] });
  },

  getTotalItems: () => get().items.reduce((total, item) => total + item.quantity, 0),
  getSelectedItemsCount: () =>
    get().items.filter((i) => i.selected !== false).reduce((total, item) => total + item.quantity, 0),
  getSubtotal: () => get().items.reduce((total, item) => total + item.price * item.quantity, 0),
  getSelectedSubtotal: () =>
    get().items
      .filter((i) => i.selected !== false)
      .reduce((total, item) => total + item.price * item.quantity, 0),
  getSelectedItems: () => get().items.filter((i) => i.selected !== false),
}));
