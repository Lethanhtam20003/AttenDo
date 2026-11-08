import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { HostLiveContent } from '@/components/host/HostLiveContent';

type HostLiveScreenProps = {
  params: Promise<{ eventId: string }>;
};

async function HostLiveRoute({ params }: HostLiveScreenProps) {
  const { eventId } = await params;
  return <HostLiveContent eventId={eventId} />;
}

export default function HostLiveScreen(props: HostLiveScreenProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            <p className="text-xs text-slate-500 font-medium">Đang tải màn hình phát sóng...</p>
          </div>
        </div>
      }
    >
      <HostLiveRoute {...props} />
    </Suspense>
  );
}
