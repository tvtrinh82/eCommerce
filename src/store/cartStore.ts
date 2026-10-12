import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  productId: number;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

interface CartState {
  cart: CartItem[];
  isCartVisible: boolean;
  addToCart: (item: CartItem) => void;
  removeFromCart: (productId: number) => void;
  clearCart: () => void;
  setCartVisible: (visible: boolean) => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      cart: [],
      isCartVisible: false,
      addToCart: (newItem) => set((state) => {
        const existing = state.cart.find((i) => i.productId === newItem.productId);
        if (existing) {
          return {
            cart: state.cart.map((i) =>
              i.productId === newItem.productId ? { ...i, quantity: i.quantity + newItem.quantity } : i
            )
          };
        }
        return { cart: [...state.cart, newItem] };
      }),
      removeFromCart: (productId) => set((state) => ({
        cart: state.cart.filter((i) => i.productId !== productId)
      })),
      clearCart: () => set({ cart: [] }),
      setCartVisible: (visible) => set({ isCartVisible: visible }),
    }),
    {
      name: 'cart-storage',
    }
  )
);
