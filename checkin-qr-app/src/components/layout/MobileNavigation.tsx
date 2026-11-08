'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { LogOut, Menu } from 'lucide-react';
import { logout } from '@/actions/auth';
import { useMobileNavigationStore } from '@/stores/mobile-navigation-store';

interface MobileNavigationProps {
  isAuthenticated: boolean;
}

export function MobileNavigation({ isAuthenticated }: MobileNavigationProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const isMobileMenuOpen = useMobileNavigationStore((state) => state.isMobileMenuOpen);
  const setIsMobileMenuOpen = useMobileNavigationStore((state) => state.setIsMobileMenuOpen);
  const toggleMobileMenu = useMobileNavigationStore((state) => state.toggleMobileMenu);

  useEffect(() => {
    if (!isMobileMenuOpen) return;

    function handlePointerDown(event: PointerEvent) {
      if (event.target instanceof Node && !menuRef.current?.contains(event.target)) {
        setIsMobileMenuOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsMobileMenuOpen(false);
    }

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMobileMenuOpen, setIsMobileMenuOpen]);

  function handleNavigation() {
    setIsMobileMenuOpen(false);
  }

  return (
    <div ref={menuRef} className="relative sm:hidden">
      <button
        type="button"
        aria-expanded={isMobileMenuOpen}
        aria-controls="mobile-navigation"
        onClick={toggleMobileMenu}
        className="flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-700"
      >
        <Menu className="h-4 w-4" />
        Menu
      </button>
      {isMobileMenuOpen && (
        <nav
          id="mobile-navigation"
          className="absolute right-0 top-full z-50 mt-2 flex w-56 flex-col gap-1 rounded-2xl border border-slate-200 bg-white p-2 text-sm font-medium text-slate-700 shadow-xl"
        >
          <Link href="/#services" onClick={handleNavigation} className="rounded-xl px-3 py-3 hover:bg-slate-50">Dịch vụ</Link>
          <Link href="/#solutions" onClick={handleNavigation} className="rounded-xl px-3 py-3 hover:bg-slate-50">Giải pháp</Link>
          <Link href="/#about" onClick={handleNavigation} className="rounded-xl px-3 py-3 hover:bg-slate-50">Giới thiệu</Link>
          <Link href="/contact" onClick={handleNavigation} className="rounded-xl px-3 py-3 hover:bg-slate-50">Liên hệ</Link>
          {isAuthenticated ? (
            <>
              <Link href="/host/manage" onClick={handleNavigation} className="rounded-xl px-3 py-3 hover:bg-slate-50">Quản lý</Link>
              <form action={logout}>
                <button
                  type="submit"
                  onClick={handleNavigation}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-3 text-left hover:bg-slate-50"
                >
                  <LogOut className="h-4 w-4" />
                  Đăng xuất
                </button>
              </form>
            </>
          ) : (
            <Link href="/auth" onClick={handleNavigation} className="rounded-xl bg-blue-600 px-3 py-3 text-white hover:bg-blue-700">Đăng nhập</Link>
          )}
        </nav>
      )}
    </div>
  );
}
