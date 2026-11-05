import { Loader2 } from 'lucide-react';

export default function HostLiveLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div role="status" className="flex flex-col items-center gap-3">
        <Loader2 aria-hidden="true" className="h-8 w-8 animate-spin text-blue-600" />
        <p className="text-xs font-medium text-slate-500">Đang tải màn hình phát sóng...</p>
      </div>
    </main>
  );
}