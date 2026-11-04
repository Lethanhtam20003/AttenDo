import Link from "next/link";
import Image from "next/image";
import { LogOut, Menu } from "lucide-react";
import { connection } from "next/server";
import { logout } from "@/actions/auth";
import { getUserSession } from "@/lib/supabase/server";

export default async function Header() {
  await connection();
  const user = await getUserSession();

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/80">
      <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between px-4 py-2 sm:px-6 lg:px-8">
        <Link href="/" className="flex min-w-0 items-center gap-2.5">
          <Image
            src="/logo/trung-tam-cung-ung-dich-vu-cong-xa-xuan-son.png"
            alt="Logo Trung tâm Cung ứng Dịch vụ công xã Xuân Sơn"
            width={48}
            height={48}
            priority
            className="h-11 w-11 shrink-0 rounded-full object-contain"
          />
          <span className="max-w-52 text-[11px] font-bold leading-tight text-slate-900 sm:max-w-none sm:text-sm">
            Trung tâm Cung ứng Dịch vụ công
            <span className="mt-0.5 block text-blue-700">Xã Xuân Sơn</span>
          </span>
        </Link>

        <nav className="hidden shrink-0 items-center gap-5 text-sm font-medium text-slate-600 sm:flex">
          <Link href="/#services" className="transition-colors hover:text-blue-600">Dịch vụ</Link>
          <Link href="/#solutions" className="transition-colors hover:text-blue-600">Giải pháp</Link>
          <Link href="/#about" className="transition-colors hover:text-blue-600">Giới thiệu</Link>
          <Link href="/#contact" className="transition-colors hover:text-blue-600">Liên hệ</Link>
          {user && (
              <Link
                href="/host/manage"
                className="transition-colors hover:text-blue-600"
              >
                Quản lý
              </Link>
          )}
          {user ? (
              <form action={logout}>
                <button
                  type="submit"
                  className="flex min-h-11 items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 transition-all hover:bg-slate-200"
                >
                  <LogOut className="w-4 h-4" />
                  Đăng xuất
                </button>
              </form>
          ) : (
            <Link
              href="/auth"
              className="flex min-h-11 items-center rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-blue-700"
            >
              Đăng nhập
            </Link>
          )}
        </nav>

        <details className="group relative sm:hidden">
          <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-700 [&::-webkit-details-marker]:hidden">
            <Menu className="h-4 w-4" />
            Menu
          </summary>
          <nav className="absolute right-0 top-full z-50 mt-2 flex w-56 flex-col gap-1 rounded-2xl border border-slate-200 bg-white p-2 text-sm font-medium text-slate-700 shadow-xl">
            <Link href="/#services" className="rounded-xl px-3 py-3 hover:bg-slate-50">Dịch vụ</Link>
            <Link href="/#solutions" className="rounded-xl px-3 py-3 hover:bg-slate-50">Giải pháp</Link>
            <Link href="/#about" className="rounded-xl px-3 py-3 hover:bg-slate-50">Giới thiệu</Link>
            <Link href="/#contact" className="rounded-xl px-3 py-3 hover:bg-slate-50">Liên hệ</Link>
            {user ? (
              <>
                <Link href="/host/manage" className="rounded-xl px-3 py-3 hover:bg-slate-50">Quản lý</Link>
                <form action={logout}>
                  <button type="submit" className="flex w-full items-center gap-2 rounded-xl px-3 py-3 text-left hover:bg-slate-50">
                    <LogOut className="h-4 w-4" />
                    Đăng xuất
                  </button>
                </form>
              </>
            ) : (
              <Link href="/auth" className="rounded-xl bg-blue-600 px-3 py-3 text-white hover:bg-blue-700">Đăng nhập</Link>
            )}
          </nav>
        </details>
      </div>
    </header>
  );
}
