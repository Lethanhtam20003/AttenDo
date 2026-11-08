import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  BadgeCheck,
  Building2,
  ShieldCheck,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import { Solutions } from "@/components/Solutions";

const ABOUT_PILLARS = [
  {
    icon: ShieldCheck,
    title: "Chính xác & Minh bạch",
    description:
      "Xác thực đa tầng bằng vị trí GPS, mã QR tự làm mới và mã PIN trực tiếp, giúp ngăn chặn điểm danh hộ và ghi nhận thời gian thực.",
  },
  {
    icon: Zap,
    title: "Đơn giản & Dễ tiếp cận",
    description:
      "Hoạt động mượt mà ngay trên trình duyệt điện thoại, Zalo và Safari mà không yêu cầu người dân hay cán bộ cài đặt thêm ứng dụng.",
  },
  {
    icon: Users,
    title: "Sát thực tiễn địa phương",
    description:
      "Thiết kế linh hoạt các trường thông tin cho hội nghị, tập huấn, sinh hoạt cộng đồng tại xã Xuân Sơn và xuất báo cáo CSV tức thì.",
  },
] as const;

const WORKFLOW_STEPS = [
  {
    step: "01",
    title: "Khởi tạo phiên điểm danh",
    description: "Cán bộ tổ chức chọn phương thức xác thực (GPS, QR động hoặc PIN) và cấu hình thông tin cần thu thập.",
  },
  {
    step: "02",
    title: "Quét mã tại điểm tổ chức",
    description: "Người tham dự quét mã QR trên màn hình trình chiếu hoặc mở liên kết để điền thông tin điểm danh nhanh.",
  },
  {
    step: "03",
    title: "Theo dõi & Xuất báo cáo",
    description: "Danh sách có mặt cập nhật trực tiếp theo thời gian thực và hỗ trợ tải xuống tệp CSV phục vụ lưu trữ.",
  },
] as const;

export const metadata: Metadata = {
  title: "Hệ thống điểm danh | Trung tâm Cung ứng Dịch vụ công xã Xuân Sơn",
  description: "Hệ thống điểm danh do Trung tâm Cung ứng Dịch vụ công xã Xuân Sơn xây dựng, hỗ trợ QR động, mã PIN và xác thực vị trí GPS.",
};

export default function HomePage() {
  return (
    <div className="flex flex-1 flex-col bg-white text-slate-800 antialiased">
      <div className="flex flex-1 flex-col">
        <section className="relative isolate overflow-hidden bg-slate-950">
          <Image
            src="/contact-background.png"
            alt="Trung tâm Cung ứng Dịch vụ công xã Xuân Sơn"
            fill
            priority
            className="-z-20 object-cover object-center"
          />
          <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-r from-brand-navy/92 via-slate-950/80 to-brand-navy/60" />
          <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1.15fr_0.85fr] lg:px-8 lg:py-24">
            <div className="text-center lg:text-left">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-gold/35 bg-white/10 px-3 py-1.5 text-xs font-semibold text-brand-gold shadow-sm backdrop-blur-sm">
                <Building2 className="h-4 w-4 text-brand-gold" />
                Trung tâm Cung ứng Dịch vụ công xã Xuân Sơn
              </div>
              <p className="mb-3 text-sm font-bold uppercase tracking-[0.16em] text-brand-sky">
                Nền tảng dịch vụ số địa phương
              </p>
              <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
                Giải pháp số,
                <span className="block text-brand-gold">phục vụ cộng đồng</span>
              </h1>
              <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-200 sm:text-lg lg:mx-0">
                Trung tâm xây dựng và phát triển các giải pháp, dịch vụ số phục vụ địa phương. Hệ thống điểm danh là dịch vụ đang được triển khai.
              </p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
                <Link
                  href="#solutions"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-brand-blue px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-sky focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-gold/30"
                >
                  Khám phá giải pháp
                  <ArrowDown className="h-4 w-4" />
                </Link>
                <Link
                  href="#about"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/10 px-5 py-3 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
                >
                  Về Trung tâm
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-sm">
              <div className="absolute inset-4 rounded-[2rem] bg-brand-gold/25 blur-2xl" />
              <div className="relative rounded-[2rem] p-6 text-center sm:p-8">
              <Image
                src="/logo/trung-tam-cung-ung-dich-vu-cong-xa-xuan-son.png"
                alt="Biểu trưng Trung tâm Cung ứng Dịch vụ công xã Xuân Sơn"
                width={192}
                height={192}
                priority
                className="mx-auto h-36 w-36 rounded-full object-contain sm:h-48 sm:w-48"
              />
                <div className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-brand-green/10 px-3 py-2.5 text-sm font-semibold text-brand-green">
                  <BadgeCheck className="h-4 w-4 shrink-0" />
                  Đang phát triển dịch vụ số
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* <section id="services" className="scroll-mt-24 py-14 sm:py-20">
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
        </section> */}

        <Solutions />

        <section id="about" className="scroll-mt-24 border-t border-slate-200 bg-white py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-12">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-brand-blue">
                  Về đơn vị phát triển
                </p>
                <h2 className="text-2xl font-extrabold tracking-tight text-brand-navy sm:text-3xl lg:text-4xl">
                  Công nghệ số gắn liền với nhu cầu thực tiễn địa phương
                </h2>
                <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base">
                  Trung tâm Cung ứng Dịch vụ công xã Xuân Sơn hướng tới số hóa từng bước các nghiệp vụ hành chính, hội họp và sinh hoạt cộng đồng tại cơ sở — giảm thiểu sổ sách thủ công, tiết kiệm thời gian tổ chức và chuẩn hóa dữ liệu số.
                </p>
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <Link
                    href="/contact"
                    className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand-navy px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-blue"
                  >
                    Thông tin liên hệ
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="#solutions"
                    className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-brand-blue/30 hover:text-brand-navy"
                  >
                    Xem các giải pháp
                  </Link>
                </div>
              </div>

              <div className="rounded-3xl border border-brand-blue/15 bg-gradient-to-br from-brand-blue/5 via-white to-brand-green/5 p-6 shadow-sm sm:p-8">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-navy text-brand-gold shadow-sm">
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <div>
                    <span className="inline-block rounded-full bg-brand-blue/10 px-2.5 py-0.5 text-xs font-semibold text-brand-navy">
                      Sứ mệnh chuyển đổi số cơ sở
                    </span>
                    <h3 className="mt-2 text-lg font-bold text-slate-900 sm:text-xl">
                      Trung tâm Cung ứng Dịch vụ công xã Xuân Sơn
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Lấy sự thuận tiện của cán bộ và người dân làm trọng tâm, mỗi công cụ trên nền tảng đều được thiết kế gọn nhẹ, trực quan, bảo mật và vận hành ổn định trong điều kiện thực tế tại địa phương.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-12 grid gap-4 sm:mt-14 md:grid-cols-3 lg:gap-6">
              {ABOUT_PILLARS.map(({ icon: Icon, title, description }) => (
                <div
                  key={title}
                  className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-5 transition hover:border-brand-blue/30 hover:bg-white hover:shadow-sm sm:p-6"
                >
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-blue/10 text-brand-navy">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
                </div>
              ))}
            </div>

            <div className="mt-12 rounded-3xl border border-brand-navy/20 bg-brand-navy p-6 text-white sm:mt-14 sm:p-8 lg:p-10">
              <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-brand-gold">
                    Quy trình vận hành
                  </p>
                  <h3 className="mt-1 text-xl font-bold sm:text-2xl">
                    3 bước tổ chức điểm danh nhanh chóng
                  </h3>
                </div>
                <p className="text-xs text-blue-200/80 sm:text-sm">
                  Thiết lập trong 1 phút • Không cần cài đặt ứng dụng
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-3">
                {WORKFLOW_STEPS.map((item) => (
                  <div
                    key={item.step}
                    className="rounded-2xl border border-white/15 bg-white/5 p-5"
                  >
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-brand-gold/20 text-xs font-bold text-brand-gold">
                      {item.step}
                    </span>
                    <h4 className="mt-3 text-base font-bold text-white">{item.title}</h4>
                    <p className="mt-1.5 text-sm leading-6 text-blue-100/85">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="contact" className="scroll-mt-24 bg-brand-navy py-10 text-white sm:py-12">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
            <div>
              <p className="text-sm font-bold text-brand-gold">Trung tâm Cung ứng Dịch vụ công xã Xuân Sơn</p>
              <p className="mt-1 text-sm text-blue-100/85">Đơn vị xây dựng và phát triển nền tảng dịch vụ số này.</p>
            </div>
            <Link href="/auth" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-white px-4 py-2 text-sm font-semibold text-brand-navy transition hover:bg-brand-gold hover:text-slate-900">
              Truy cập hệ thống
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}