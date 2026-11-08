import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-slate-200/80 bg-white py-8 text-xs text-slate-500">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 text-center sm:flex-row sm:px-6 sm:text-left lg:px-8">
        <p>
          Giải pháp số được xây dựng bởi{" "}
          <span className="font-semibold text-brand-navy">
            Trung tâm Cung ứng Dịch vụ công xã Xuân Sơn
          </span>
        </p>
        <Link href="/contact" className="font-semibold text-brand-blue hover:text-brand-navy">
          Thông tin liên hệ
        </Link>
      </div>
    </footer>
  );
}
