import { Suspense } from 'react';
import Link from 'next/link';
import { connection } from 'next/server';
import { Loader2, ShieldAlert } from 'lucide-react';
import { verifyPresenterAccess } from '@/actions/presenter';
import { HostLiveContent } from '@/components/host/HostLiveContent';

type PresenterScreenProps = {
  params: Promise<{ eventId: string }>;
  searchParams: Promise<{ code?: string | string[] }>;
};

async function PresenterRoute({ params, searchParams }: PresenterScreenProps) {
  const [{ eventId }, resolvedSearchParams] = await Promise.all([params, searchParams]);
  const rawCode = resolvedSearchParams.code;
  const code = Array.isArray(rawCode) ? rawCode[0] : rawCode;

  if (!code) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <h1 className="mt-4 text-lg font-bold text-slate-900">
            Thiếu mã bảo mật trình chiếu
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Liên kết trình chiếu cần có mã bảo mật hợp lệ do quản trị viên cung cấp (dạng{' '}
            <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-800">
              ?code=...
            </code>
            ). Vui lòng yêu cầu quản trị viên sao chép lại link trình chiếu.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex min-h-10 items-center justify-center rounded-xl bg-brand-navy px-4 py-2 text-xs font-semibold text-white transition hover:bg-brand-blue"
          >
            Về trang chủ
          </Link>
        </div>
      </div>
    );
  }

  const isAllowed = await verifyPresenterAccess(eventId, code);
  if (!isAllowed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <h1 className="mt-4 text-lg font-bold text-slate-900">
            Liên kết trình chiếu không hợp lệ
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Mã bảo mật trình chiếu không đúng hoặc phiên điểm danh không tồn tại. Vui lòng liên hệ quản trị viên để nhận lại liên kết mới.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex min-h-10 items-center justify-center rounded-xl bg-brand-navy px-4 py-2 text-xs font-semibold text-white transition hover:bg-brand-blue"
          >
            Về trang chủ
          </Link>
        </div>
      </div>
    );
  }

  return <HostLiveContent eventId={eventId} presenterToken={code} />;
}

export default async function PresenterScreen(props: PresenterScreenProps) {
  await connection();

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            <p className="text-xs text-slate-500 font-medium">
              Đang xác thực liên kết trình chiếu...
            </p>
          </div>
        </div>
      }
    >
      <PresenterRoute {...props} />
    </Suspense>
  );
}
