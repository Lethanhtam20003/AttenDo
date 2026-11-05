import Link from 'next/link';
import { ArrowLeft, House, SearchX } from 'lucide-react';

export default function NotFound() {
  return (
    <section className="flex min-h-[60vh] items-center justify-center bg-slate-50 px-4 py-16">
      <div className="w-full max-w-lg text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-700">
          <SearchX aria-hidden="true" className="h-7 w-7" />
        </div>
        <p className="mt-5 text-sm font-semibold text-blue-700">LỖI 404</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Không tìm thấy trang
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Đường dẫn có thể đã thay đổi hoặc không tồn tại. Hãy quay về trang chủ hoặc liên hệ Trung tâm để được hỗ trợ.
        </p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-800"
          >
            <House aria-hidden="true" className="h-4 w-4" />
            Về trang chủ
          </Link>
          <Link
            href="/contact"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100"
          >
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            Thông tin liên hệ
          </Link>
        </div>
      </div>
    </section>
  );
}