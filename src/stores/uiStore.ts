import { create } from 'zustand';

export interface UIProduct {
  id: number;
  name: string;
  price: number;
  stock: number;
  imageUrl?: string;
  status?: string;
}

interface UIState {
  // Auth modal state
  isAuthModalOpen: boolean;
  authModalTab: 'login' | 'register';
  authRedirectUrl: string | null;
  openAuthModal: (tab?: 'login' | 'register', redirectUrl?: string | null) => void;
  closeAuthModal: () => void;
  clearAuthRedirectUrl: () => void;

  // Add to cart modal state
  isAddToCartModalOpen: boolean;
  selectedProductForCart: UIProduct | null;
  openAddToCartModal: (product: UIProduct) => void;
  closeAddToCartModal: () => void;

  // Flying cart animation
  flyOrigin: { x: number; y: number } | null;
  triggerFlyEffect: (origin: { x: number; y: number }) => void;
  clearFlyEffect: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isAuthModalOpen: false,
  authModalTab: 'login',
  authRedirectUrl: null,
  openAuthModal: (tab = 'login', redirectUrl = null) =>
    set({ isAuthModalOpen: true, authModalTab: tab, authRedirectUrl: redirectUrl }),
  closeAuthModal: () => set({ isAuthModalOpen: false }),
  clearAuthRedirectUrl: () => set({ authRedirectUrl: null }),

  isAddToCartModalOpen: false,
  selectedProductForCart: null,
  openAddToCartModal: (product) =>
    set({ isAddToCartModalOpen: true, selectedProductForCart: product }),
  closeAddToCartModal: () =>
    set({ isAddToCartModalOpen: false, selectedProductForCart: null }),

  flyOrigin: null,
  triggerFlyEffect: (origin) => set({ flyOrigin: origin }),
  clearFlyEffect: () => set({ flyOrigin: null }),
}));
