'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Building2,
  Home,
  KeyRound,
  LayoutDashboard,
  LogIn,
  LogOut,
  MapPin,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Phone,
  QrCode,
  Sparkles,
  X,
} from 'lucide-react';
import { logout } from '@/actions/auth';
import { useMobileNavigationStore } from '@/stores/mobile-navigation-store';

interface MobileNavigationProps {
  isAuthenticated: boolean;
  userEmail?: string | null;
}

interface SidebarNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  matchPrefix?: string;
  exact?: boolean;
  badge?: string;
  badgeTone?: 'blue' | 'green' | 'amber';
}

const GENERAL_NAV_ITEMS: SidebarNavItem[] = [
  {
    href: '/',
    label: 'Trang chủ',
    icon: Home,
    exact: true,
  },
  {
    href: '/#solutions',
    label: 'Giải pháp',
    icon: Sparkles,
  },
  {
    href: '/#about',
    label: 'Giới thiệu',
    icon: Building2,
  },
  {
    href: '/contact',
    label: 'Liên hệ',
    icon: Phone,
    matchPrefix: '/contact',
  },
];

const ADMIN_NAV_ITEMS: SidebarNavItem[] = [
  {
    href: '/host/manage',
    label: 'Quản lý phiên',
    icon: LayoutDashboard,
    matchPrefix: '/host/manage',
  },
  {
    href: '/host/dynamic-qr/setup',
    label: 'Tạo phiên QR động',
    icon: QrCode,
    matchPrefix: '/host/dynamic-qr',
    badge: 'QR',
    badgeTone: 'blue',
  },
  {
    href: '/host/gps/setup',
    label: 'Tạo phiên GPS',
    icon: MapPin,
    matchPrefix: '/host/gps',
    badge: 'GPS',
    badgeTone: 'green',
  },
  {
    href: '/host/qr-pin/setup',
    label: 'Tạo phiên QR + PIN',
    icon: KeyRound,
    matchPrefix: '/host/qr-pin',
    badge: 'PIN',
    badgeTone: 'amber',
  },
];

const BADGE_TONE_CLASSES: Record<NonNullable<SidebarNavItem['badgeTone']>, string> = {
  blue: 'bg-brand-blue/10 text-brand-blue',
  green: 'bg-brand-green/10 text-brand-green',
  amber: 'bg-amber-500/15 text-amber-700',
};

function isItemActive(pathname: string, item: SidebarNavItem) {
  if (item.exact) {
    return pathname === item.href;
  }
  if (item.matchPrefix) {
    return pathname.startsWith(item.matchPrefix);
  }
  return false;
}

export function MobileNavigation({
  isAuthenticated,
  userEmail,
}: MobileNavigationProps) {
  const pathname = usePathname();
  const drawerRef = useRef<HTMLDivElement>(null);
  const isMobileMenuOpen = useMobileNavigationStore(
    (state) => state.isMobileMenuOpen
  );
  const isSidebarCollapsed = useMobileNavigationStore(
    (state) => state.isSidebarCollapsed
  );
  const setIsMobileMenuOpen = useMobileNavigationStore(
    (state) => state.setIsMobileMenuOpen
  );
  const toggleMobileMenu = useMobileNavigationStore(
    (state) => state.toggleMobileMenu
  );
  const toggleSidebarCollapsed = useMobileNavigationStore(
    (state) => state.toggleSidebarCollapsed
  );

  useEffect(() => {
    if (!isMobileMenuOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsMobileMenuOpen(false);
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMobileMenuOpen, setIsMobileMenuOpen]);

  function handleNavigation() {
    setIsMobileMenuOpen(false);
  }

  const avatarInitial = (userEmail?.trim()?.[0] ?? 'Q').toUpperCase();

  function renderNavGroup(
    title: string,
    items: SidebarNavItem[],
    collapsed: boolean
  ) {
    return (
      <div className="space-y-1">
        {collapsed ? (
          <div className="mx-auto my-2 h-px w-8 bg-slate-200/80" aria-hidden="true" />
        ) : (
          <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {title}
          </p>
        )}
        <ul className="space-y-0.5">
          {items.map((item) => {
            const Icon = item.icon;
            const active = isItemActive(pathname, item);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={handleNavigation}
                  title={collapsed ? item.label : undefined}
                  aria-current={active ? 'page' : undefined}
                  className={`group relative flex items-center rounded-xl text-[13px] transition-all ${
                    collapsed
                      ? 'mx-auto h-10 w-10 justify-center'
                      : 'gap-2.5 px-3 py-2'
                  } ${
                    active
                      ? 'bg-brand-blue/8 font-semibold text-brand-navy shadow-[inset_0_0_0_1px_rgba(11,59,130,0.16)] before:absolute before:left-0 before:top-1/2 before:h-4 before:w-1 before:-translate-y-1/2 before:rounded-r-full before:bg-brand-navy'
                      : 'font-medium text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 shrink-0 transition-colors ${
                      active
                        ? 'text-brand-blue'
                        : 'text-slate-400 group-hover:text-brand-navy'
                    }`}
                  />
                  {!collapsed && (
                    <>
                      <span className="min-w-0 flex-1 truncate">{item.label}</span>
                      {item.badge && (
                        <span
                          className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold leading-none ${
                            item.badgeTone
                              ? BADGE_TONE_CLASSES[item.badgeTone]
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }

  function renderAccountSection(collapsed: boolean) {
    if (!isAuthenticated) {
      return collapsed ? (
        <Link
          href="/auth"
          onClick={handleNavigation}
          title="Đăng nhập hệ thống"
          className="mx-auto flex h-9 w-9 items-center justify-center rounded-lg bg-brand-navy text-white shadow-2xs transition hover:bg-brand-blue"
        >
          <LogIn className="h-3.5 w-3.5" />
        </Link>
      ) : (
        <Link
          href="/auth"
          onClick={handleNavigation}
          className="flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-brand-navy px-3 text-xs font-semibold text-white shadow-2xs transition hover:bg-brand-blue"
        >
          <LogIn className="h-3.5 w-3.5" />
          <span>Đăng nhập hệ thống</span>
        </Link>
      );
    }

    if (collapsed) {
      return (
        <div className="flex flex-col items-center gap-2">
          <div
            title={userEmail ?? 'Quản trị viên'}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-navy text-xs font-bold text-brand-gold shadow-2xs"
          >
            {avatarInitial}
          </div>
          <form action={logout}>
            <button
              type="submit"
              onClick={handleNavigation}
              title="Đăng xuất"
              aria-label="Đăng xuất"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200/90 bg-white text-slate-500 shadow-2xs transition-colors hover:border-brand-red/30 hover:bg-red-50 hover:text-brand-red"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      );
    }

    return (
      <div className="flex items-center justify-between gap-2 rounded-xl border border-slate-200/80 bg-slate-50/80 p-2">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-navy text-[11px] font-bold text-brand-gold shadow-2xs">
            {avatarInitial}
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold leading-tight text-slate-800">
              Quản trị viên
            </p>
            <p className="truncate text-[10px] leading-tight text-slate-500">
              {userEmail ?? 'Đã xác thực'}
            </p>
          </div>
        </div>
        <form action={logout} className="shrink-0">
          <button
            type="submit"
            onClick={handleNavigation}
            title="Đăng xuất khỏi hệ thống"
            className="inline-flex h-7 items-center gap-1 rounded-lg border border-slate-200/90 bg-white px-2 text-[11px] font-medium text-slate-600 shadow-2xs transition-colors hover:border-brand-red/30 hover:bg-red-50 hover:text-brand-red focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red/20"
          >
            <LogOut className="h-3 w-3 shrink-0" />
            <span>Đăng xuất</span>
          </button>
        </form>
      </div>
    );
  }

  return (
    <>
      {/* Thanh Topbar gọn nhẹ cho màn hình Mobile / Tablet (< lg) */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 backdrop-blur-md lg:hidden">
        <div className="flex min-w-0 items-center gap-2.5">
          <button
            type="button"
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-admin-sidebar"
            aria-label="Mở menu điều hướng"
            onClick={toggleMobileMenu}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200/80 bg-white text-slate-700 shadow-2xs transition hover:bg-slate-50"
          >
            <Menu className="h-4 w-4" />
          </button>
          <Link href="/" className="flex min-w-0 items-center gap-2">
            <Image
              src="/logo/trung-tam-cung-ung-dich-vu-cong-xa-xuan-son.png"
              alt="Logo Trung tâm Cung ứng Dịch vụ công xã Xuân Sơn"
              width={32}
              height={32}
              priority
              className="h-8 w-8 shrink-0 rounded-full object-contain ring-1 ring-brand-navy/15"
            />
            <span className="truncate text-xs font-bold leading-tight text-brand-navy">
              TT Cung ứng DVC{' '}
              <span className="text-brand-blue">Xuân Sơn</span>
            </span>
          </Link>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {isAuthenticated ? (
            <form action={logout}>
              <button
                type="submit"
                title="Đăng xuất"
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200/90 bg-white px-2.5 text-xs font-medium text-slate-600 shadow-2xs transition-colors hover:border-brand-red/30 hover:bg-red-50 hover:text-brand-red"
              >
                <LogOut className="h-3.5 w-3.5 shrink-0" />
                <span>Đăng xuất</span>
              </button>
            </form>
          ) : (
            <Link
              href="/auth"
              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-brand-navy px-3 text-xs font-semibold text-white shadow-2xs transition hover:bg-brand-blue"
            >
              <LogIn className="h-3.5 w-3.5" />
              <span>Đăng nhập</span>
            </Link>
          )}
        </div>
      </header>

      {/* Drawer Sidebar trên Mobile (< lg) */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
            aria-hidden="true"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <aside
            id="mobile-admin-sidebar"
            ref={drawerRef}
            aria-label="Thanh điều hướng"
            className="relative z-10 flex h-full w-72 max-w-[84vw] flex-col border-r border-slate-200/80 bg-white shadow-2xl"
          >
            <div className="h-1 w-full bg-gradient-to-r from-brand-navy via-brand-blue to-brand-gold" aria-hidden="true" />
            <div className="flex h-16 items-center justify-between border-b border-slate-100 px-4">
              <Link
                href="/"
                onClick={handleNavigation}
                className="flex min-w-0 items-center gap-2.5"
              >
                <Image
                  src="/logo/trung-tam-cung-ung-dich-vu-cong-xa-xuan-son.png"
                  alt="Logo Trung tâm Cung ứng Dịch vụ công xã Xuân Sơn"
                  width={36}
                  height={36}
                  className="h-9 w-9 shrink-0 rounded-xl border border-brand-navy/15 bg-white p-0.5 object-contain"
                />
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold leading-tight text-brand-navy">
                    Trung tâm Cung ứng DVC
                  </p>
                  <p className="mt-0.5 flex items-center gap-1 truncate text-[11px] font-semibold text-brand-blue">
                    <span className="text-[10px] text-brand-orange" aria-hidden="true">★</span>
                    Xã Xuân Sơn
                  </p>
                </div>
              </Link>
              <button
                type="button"
                aria-label="Đóng menu điều hướng"
                onClick={() => setIsMobileMenuOpen(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
              {renderNavGroup('Điều hướng chung', GENERAL_NAV_ITEMS, false)}
              {renderNavGroup('Quản trị điểm danh', ADMIN_NAV_ITEMS, false)}
            </nav>

            <div className="border-t border-slate-100 p-3">
              {renderAccountSection(false)}
            </div>
          </aside>
        </div>
      )}

      {/* Modern Admin Sidebar cố định bên trái trên Desktop (>= lg) */}
      <aside
        aria-label="Thanh điều hướng chính"
        className={`hidden lg:sticky lg:top-0 lg:z-40 lg:flex lg:h-screen lg:shrink-0 lg:flex-col lg:border-r lg:border-slate-200/80 lg:bg-white lg:transition-[width] lg:duration-200 lg:ease-in-out ${
          isSidebarCollapsed ? 'lg:w-[72px]' : 'lg:w-64'
        }`}
      >
        <div className="h-1 w-full shrink-0 bg-gradient-to-r from-brand-navy via-brand-blue to-brand-gold" aria-hidden="true" />
        <div
          className={`flex h-16 shrink-0 items-center border-b border-slate-100 ${
            isSidebarCollapsed ? 'justify-center px-2' : 'justify-between px-3.5'
          }`}
        >
          <Link
            href="/"
            title="Trung tâm Cung ứng Dịch vụ công xã Xuân Sơn"
            className="flex min-w-0 items-center gap-2.5"
          >
            <Image
              src="/logo/trung-tam-cung-ung-dich-vu-cong-xa-xuan-son.png"
              alt="Logo Trung tâm Cung ứng Dịch vụ công xã Xuân Sơn"
              width={36}
              height={36}
              priority
              className="h-9 w-9 shrink-0 rounded-xl border border-brand-navy/15 bg-white p-0.5 object-contain shadow-2xs"
            />
            {!isSidebarCollapsed && (
              <div className="min-w-0">
                <p className="truncate text-[13px] font-bold leading-tight text-brand-navy">
                  Trung tâm Cung ứng DVC
                </p>
                <p className="mt-0.5 flex items-center gap-1 truncate text-[11px] font-semibold text-brand-blue">
                  <span className="text-[10px] text-brand-orange" aria-hidden="true">★</span>
                  Xã Xuân Sơn
                </p>
              </div>
            )}
          </Link>

          {!isSidebarCollapsed && (
            <button
              type="button"
              onClick={toggleSidebarCollapsed}
              title="Thu gọn thanh bên"
              aria-label="Thu gọn thanh bên"
              className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-brand-navy"
            >
              <PanelLeftClose className="h-4 w-4" />
            </button>
          )}
        </div>

        {isSidebarCollapsed && (
          <div className="flex justify-center border-b border-slate-100 py-2">
            <button
              type="button"
              onClick={toggleSidebarCollapsed}
              title="Mở rộng thanh bên"
              aria-label="Mở rộng thanh bên"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-brand-navy"
            >
              <PanelLeftOpen className="h-4 w-4" />
            </button>
          </div>
        )}

        <nav className="flex-1 space-y-5 overflow-y-auto px-2.5 py-4">
          {renderNavGroup('Điều hướng chung', GENERAL_NAV_ITEMS, isSidebarCollapsed)}
          {renderNavGroup('Quản trị điểm danh', ADMIN_NAV_ITEMS, isSidebarCollapsed)}
        </nav>

        <div className="border-t border-slate-100 p-2.5">
          {renderAccountSection(isSidebarCollapsed)}
        </div>
      </aside>
    </>
  );
}
