import Link from "next/link";
import Image from "next/image";
import { LogOut } from "lucide-react";
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

        <nav className="flex shrink-0 items-center gap-3 text-xs font-medium text-slate-600 sm:gap-6 sm:text-sm">
          <Link href="/#solutions" className="hover:text-blue-600 transition-colors">
            Tính Năng
          </Link>
          {user ? (
            <>
              <Link
                href="/host/manage"
                className="hover:text-blue-600 transition-colors"
              >
                Quản lý
              </Link>
              <form action={logout}>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all text-xs font-semibold"
                >
                  <LogOut className="w-4 h-4" />
                  Đăng xuất
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/auth"
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-all text-xs font-semibold shadow-sm"
            >
              Đăng nhập
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
