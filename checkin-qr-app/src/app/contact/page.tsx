import type { Metadata } from 'next';
import { Clock3, Mail, MapPin, Phone } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Liên hệ | Trung tâm Cung ứng Dịch vụ công xã Xuân Sơn',
  description: 'Thông tin liên hệ Trung tâm Cung ứng Dịch vụ công xã Xuân Sơn.',
};

const contactDetails = [
  {
    icon: MapPin,
    label: 'Địa chỉ',
    value: 'Tổ 11, ấp Sơn Tân, xã Xuân Sơn, TP. Hồ Chí Minh',
    href: null,
  },
  {
    icon: Phone,
    label: 'Điện thoại',
    value: '0123 456 789',
    href: 'tel:+84123456789',
  },
  {
    icon: Mail,
    label: 'Email',
    value: 'lienhe@example.com',
    href: 'mailto:lienhe@example.com',
  },
  {
    icon: Clock3,
    label: 'Giờ làm việc',
    value: 'Thứ Hai – Thứ Sáu, 08:00 – 17:00',
    href: null,
  },
];

export default function ContactPage() {
  return (
    <div className="flex-1 bg-slate-50">
      <section
        aria-label="Trung tâm Cung ứng Dịch vụ công xã Xuân Sơn"
        className="h-[280px] bg-[url('/contact-background.png')] bg-cover bg-top sm:h-[380px] lg:h-[460px] lg:bg-[position:center_25%]"
      >
        <div className="h-full bg-slate-950/10" />
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[1.2fr_0.8fr] lg:px-8">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-sm font-semibold text-brand-blue">TRUNG TÂM CUNG ỨNG DỊCH VỤ CÔNG</p>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-brand-navy">
            Thông tin liên hệ
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Bạn cần tư vấn hoặc hỗ trợ sử dụng hệ thống? Hãy liên hệ qua các thông tin dưới đây.
          </p>

          <dl className="mt-7 grid gap-3 sm:grid-cols-2">
            {contactDetails.map(({ icon: Icon, label, value, href }) => (
              <div
                key={label}
                className="flex min-h-28 items-start gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-blue/10 text-brand-navy">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
                  <dd className="mt-1.5 break-words text-sm font-semibold text-slate-900">
                    {href ? (
                      <a className="transition-colors hover:text-brand-blue" href={href}>
                        {value}
                      </a>
                    ) : (
                      value
                    )}
                  </dd>
                </div>
              </div>
            ))}
          </dl>
        </div>

        <aside className="flex flex-col justify-between rounded-3xl bg-brand-navy p-6 text-white shadow-sm sm:p-8">
          <div>
            <p className="text-sm font-semibold text-brand-gold">Chúng tôi sẵn sàng hỗ trợ</p>
            <h2 className="mt-3 text-2xl font-bold">Cùng xây dựng dịch vụ số thuận tiện hơn</h2>
            <p className="mt-4 text-sm leading-6 text-blue-100/85">
              Trung tâm luôn tiếp nhận ý kiến để cải thiện trải nghiệm sử dụng các dịch vụ số tại địa phương.
            </p>
          </div>
          <p className="mt-8 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-xs leading-5 text-blue-100/80">
            Thông tin liên hệ trên trang hiện là dữ liệu mẫu và sẽ được cập nhật sau.
          </p>
        </aside>
      </section>
    </div>
  );
}
