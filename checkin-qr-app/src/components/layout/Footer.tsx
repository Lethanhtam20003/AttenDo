export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200/80 py-8 text-xs text-slate-500">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 text-center sm:flex-row sm:px-6 sm:text-left lg:px-8">
        <p>
          Hệ thống điểm danh được xây dựng bởi{" "}
          <span className="font-semibold text-slate-800">
            Trung tâm Cung ứng Dịch vụ công xã Xuân Sơn
          </span>
        </p>
        <p>© 2026 Trung tâm Cung ứng Dịch vụ công xã Xuân Sơn</p>
      </div>
    </footer>
  );
}
