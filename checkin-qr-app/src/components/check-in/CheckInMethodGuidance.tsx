'use client';

import { QrCode } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import type { CheckInRequirements } from '@/lib/check-in/solution';

export function CheckInMethodGuidance({
  requirements,
}: {
  requirements: CheckInRequirements;
}) {
  const searchParams = useSearchParams();
  const hasQrToken = Boolean(searchParams.get('qr'));

  if (requirements.dynamicQr) {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
        <QrCode className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" />
        <div>
          <p className="font-semibold">Điểm danh bằng QR động</p>
          <p className="mt-1 text-xs leading-relaxed">
            Quét mã QR đang hiển thị trên màn hình Host và gửi biểu mẫu ngay. Mã cần được máy chủ xác minh khi gửi.
          </p>
          <p className={`mt-2 text-xs font-medium ${hasQrToken ? 'text-emerald-700' : 'text-amber-800'}`} role="status">
            {hasQrToken
              ? 'Liên kết có mã QR; tính hợp lệ sẽ được xác minh khi gửi.'
              : 'Liên kết chưa có mã QR. Hãy quét lại mã đang hiển thị trên màn hình Host.'}
          </p>
        </div>
      </div>
    );
  }

  if (requirements.requireLocation) {
    return null;
  }

  return (
    <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 p-3 text-sm text-blue-900">
      <QrCode className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" />
      <div>
        <p className="font-semibold">
          {requirements.requirePin ? 'Điểm danh bằng QR kết hợp PIN' : 'Điểm danh bằng QR'}
        </p>
        <p className="mt-1 text-xs leading-relaxed">
          {requirements.requirePin
            ? 'Mở biểu mẫu từ mã QR của phiên, sau đó nhập mã PIN đang hiển thị trên màn hình Host.'
            : 'Mở biểu mẫu từ mã QR của phiên để xác nhận có mặt.'}
        </p>
      </div>
    </div>
  );
}
