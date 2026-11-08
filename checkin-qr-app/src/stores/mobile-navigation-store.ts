import { create } from 'zustand';

interface MobileNavigationState {
  isMobileMenuOpen: boolean;
  isSidebarCollapsed: boolean;
  setIsMobileMenuOpen: (isOpen: boolean) => void;
  toggleMobileMenu: () => void;
  setIsSidebarCollapsed: (isCollapsed: boolean) => void;
  toggleSidebarCollapsed: () => void;
}

export const useMobileNavigationStore = create<MobileNavigationState>((set) => ({
  isMobileMenuOpen: false,
  isSidebarCollapsed: false,
  setIsMobileMenuOpen: (isMobileMenuOpen) => set({ isMobileMenuOpen }),
  toggleMobileMenu: () =>
    set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),
  setIsSidebarCollapsed: (isSidebarCollapsed) => set({ isSidebarCollapsed }),
  toggleSidebarCollapsed: () =>
    set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
}));
