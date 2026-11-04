import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowRight, BadgeCheck, Building2, ClipboardCheck, Sparkles } from "lucide-react";
import { Solutions } from "@/components/Solutions";

export const metadata: Metadata = {
  title: "Hệ thống điểm danh | Trung tâm Cung ứng Dịch vụ công xã Xuân Sơn",
  description: "Hệ thống điểm danh do Trung tâm Cung ứng Dịch vụ công xã Xuân Sơn xây dựng, hỗ trợ QR động, mã PIN và xác thực vị trí GPS.",
};

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-white text-slate-800 antialiased">
      <main className="flex flex-1 flex-col">
        <section className="relative isolate overflow-hidden bg-gradient-to-br from-blue-50 via-white to-emerald-50">
          <div className="pointer-events-none absolute -right-24 -top-32 -z-10 h-96 w-96 rounded-full bg-blue-100/70 blur-3xl" />
          <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1.15fr_0.85fr] lg:px-8 lg:py-24">
            <div className="text-center lg:text-left">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/80 px-3 py-1.5 text-xs font-semibold text-blue-800 shadow-sm">
                <Building2 className="h-4 w-4" />
                Trung tâm Cung ứng Dịch vụ công xã Xuân Sơn
              </div>
              <p className="mb-3 text-sm font-bold uppercase tracking-[0.16em] text-blue-700">
                Nền tảng dịch vụ số địa phương
              </p>
              <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
                Giải pháp số,
                <span className="block text-blue-700">phục vụ cộng đồng</span>
              </h1>
              <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg lg:mx-0">
                Trung tâm xây dựng và phát triển các giải pháp, dịch vụ số phục vụ địa phương. Hệ thống điểm danh là dịch vụ đang được triển khai.
              </p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
                <Link
                  href="#services"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-600/25"
                >
                  Khám phá dịch vụ
                  <ArrowDown className="h-4 w-4" />
                </Link>
                <Link
                  href="#about"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:text-blue-700"
                >
                  Về Trung tâm
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-sm">
              <div className="absolute inset-4 rounded-[2rem] bg-blue-200/50 blur-2xl" />
              <div className="relative rounded-[2rem] border border-white bg-white/90 p-6 text-center shadow-xl shadow-blue-900/10 sm:p-8">
              <Image
                src="/logo/trung-tam-cung-ung-dich-vu-cong-xa-xuan-son.png"
                alt="Biểu trưng Trung tâm Cung ứng Dịch vụ công xã Xuân Sơn"
                width={192}
                height={192}
                priority
                className="mx-auto h-36 w-36 rounded-full object-contain sm:h-48 sm:w-48"
              />
                <div className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-emerald-50 px-3 py-2.5 text-sm font-semibold text-emerald-800">
                  <BadgeCheck className="h-4 w-4 shrink-0" />
                  Đang phát triển dịch vụ số
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="services" className="scroll-mt-24 py-14 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8 max-w-2xl sm:mb-10">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-blue-700">Dịch vụ của Trung tâm</p>
              <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Dịch vụ đang triển khai</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
                Bắt đầu với công cụ giúp đơn giản hóa việc tổ chức, xác thực và theo dõi điểm danh.
              </p>
            </div>

            <article className="grid overflow-hidden rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white shadow-sm lg:grid-cols-[1fr_auto]">
              <div className="p-6 sm:p-9 lg:p-10">
                <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-blue-800 ring-1 ring-blue-100">
                  <ClipboardCheck className="h-4 w-4" />
                  Dịch vụ điểm danh
                </div>
                <h3 className="text-xl font-bold text-slate-900 sm:text-2xl">Hệ thống điểm danh thông minh</h3>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                  Tạo phiên điểm danh, chia sẻ mã QR và theo dõi người tham dự theo thời gian thực. Có thể lựa chọn QR động, xác thực GPS hoặc QR kết hợp mã PIN.
                </p>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <Link href="#solutions" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-800">
                    Chọn giải pháp điểm danh
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link href="/auth" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:text-blue-700">
                    Đăng nhập quản lý
                  </Link>
                </div>
              </div>
              <div className="hidden items-center justify-center px-10 lg:flex">
                <div className="flex h-36 w-36 items-center justify-center rounded-[2rem] bg-white text-blue-700 shadow-sm ring-1 ring-blue-100">
                  <ClipboardCheck className="h-16 w-16" strokeWidth={1.5} />
                </div>
              </div>
            </article>
          </div>
        </section>

        <Solutions />

        <section id="about" className="scroll-mt-24 border-t border-slate-200 bg-white py-14 sm:py-20">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 md:grid-cols-[0.8fr_1.2fr] md:items-center lg:px-8">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-blue-700">Đơn vị phát triển</p>
              <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Công nghệ gắn với nhu cầu địa phương</h2>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:p-7">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-blue-700 shadow-sm">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Trung tâm Cung ứng Dịch vụ công xã Xuân Sơn</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Nền tảng được xây dựng để từng bước phát triển các giải pháp số thiết thực, dễ tiếp cận và phù hợp với hoạt động của địa phương. Hệ thống điểm danh là bước triển khai hiện tại.
                  </p>
                  <Link href="#contact" className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-900">
                    Thông tin liên hệ
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="contact" className="scroll-mt-24 bg-slate-900 py-10 text-white sm:py-12">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
            <div>
              <p className="text-sm font-bold">Trung tâm Cung ứng Dịch vụ công xã Xuân Sơn</p>
              <p className="mt-1 text-sm text-slate-300">Đơn vị xây dựng và phát triển nền tảng dịch vụ số này.</p>
            </div>
            <Link href="/auth" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-blue-50">
              Truy cập hệ thống
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}