import { QrCode, Hash, MapPin } from "lucide-react";
import Link from "next/link";

export const Solutions = () => {
  const solutions = [
    {
      icon: <QrCode className="h-6 w-6 text-brand-blue" />,
      iconBg: "bg-brand-blue/10",
      title: "QR động",
      desc: "Mã QR tự làm mới theo thời gian, giúp hạn chế việc dùng ảnh chụp để điểm danh hộ.",
      link: "/host/dynamic-qr/setup",
    },
    {
      icon: <MapPin className="h-6 w-6 text-brand-green" />,
      iconBg: "bg-brand-green/10",
      title: "Xác thực vị trí GPS",
      desc: "Thiết lập vị trí và bán kính cho phép người tham dự check-in tại địa điểm tổ chức.",
      link: "/host/gps/setup",
    },
    {
      icon: (
        <span className="flex items-center gap-0.5 text-brand-navy" aria-hidden="true">
          <QrCode className="h-5 w-5" />
          <Hash className="h-4 w-4 text-brand-orange" />
        </span>
      ),
      iconBg: "bg-brand-gold/20",
      title: "QR kết hợp mã PIN",
      desc: "Xác nhận lượt điểm danh bằng cách quét QR và nhập mã PIN hiển thị trên màn hình Host.",
      link: "/host/qr-pin/setup",
    },
  ];

  return (
    <section id="solutions" className="scroll-mt-24 border-t border-slate-200/80 bg-slate-50 py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-9 max-w-2xl sm:mb-12">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-brand-blue">Các phương thức xác thực</p>
          <h2 className="text-2xl font-extrabold tracking-tight text-brand-navy sm:text-3xl">Chọn giải pháp điểm danh</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Ba phương thức cấu hình cho hệ thống điểm danh đang được Trung tâm triển khai.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {solutions.map((item) => (
            <Link
              key={item.link}
              className="group flex min-h-56 flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-brand-blue/30 hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-blue/20 sm:p-6"
              href={item.link}
            >
              <div>
                <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-xl ${item.iconBg}`}>
                  {item.icon}
                </div>
                <h3 className="mb-2 text-base font-bold text-slate-900 group-hover:text-brand-navy">{item.title}</h3>
                <p className="text-sm leading-relaxed text-slate-600">{item.desc}</p>
              </div>
              <span className="mt-5 text-sm font-semibold text-brand-navy group-hover:text-brand-blue">Thiết lập giải pháp <span aria-hidden="true">→</span></span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};
