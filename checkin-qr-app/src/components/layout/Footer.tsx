import { UserCheck } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200/80 py-8 text-xs text-slate-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center text-white">
            <UserCheck className="w-3.5 h-3.5" />
          </div>
          <span className="font-bold text-slate-900">AttenDo</span>
          <span>— Nền tảng điểm danh thông minh</span>
        </div>
        <p>© 2026 AttenDo. All rights reserved.</p>
      </div>
    </footer>
  );
}
