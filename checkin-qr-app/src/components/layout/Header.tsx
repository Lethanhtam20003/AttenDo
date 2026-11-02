import Link from "next/link";
import { LogOut, UserCheck } from "lucide-react";
import { connection } from "next/server";
import { logout } from "@/actions/auth";
import { getUserSession } from "@/lib/supabase/server";

export default async function Header() {
  await connection();
  const user = await getUserSession();

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm">
            <UserCheck className="w-5 h-5" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900">
            Atten<span className="text-blue-600">Do</span>
          </span>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-6 text-sm font-medium text-slate-600">
          <Link href="/#solutions" className="hover:text-blue-600 transition-colors">
            Tính Năng
          </Link>
          {user ? (
            <>
              <Link
                href="/host/setup"
                className="hover:text-blue-600 transition-colors"
              >
                Bảng điều khiển
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
