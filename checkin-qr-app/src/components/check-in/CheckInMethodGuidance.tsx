'use client';

import { MapPin, Navigation, QrCode } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import type { useCheckInLocation } from '@/hooks/check-in/useCheckInLocation';
import type { CheckInRequirements } from '@/lib/check-in/solution';
import type { CheckInEvent } from '@/types/database';
import LocationHelpPrompt from '@/components/check-in/LocationHelpPrompt';
import { detectCheckInEnvironment } from '@/lib/check-in/browser';

type LocationState = ReturnType<typeof useCheckInLocation>;

export function CheckInMethodGuidance({
  event,
  requirements,
  location,
  userAgent,
}: {
  event: CheckInEvent;
  requirements: CheckInRequirements;
  location: LocationState | null;
  userAgent: string;
}) {
  const searchParams = useSearchParams();
  const hasQrToken = Boolean(searchParams.get('qr'));

  return (
    <>
      {requirements.requireLocation && location && (
        <>
          <GpsGuidance event={event} location={location} />
          <LocationHelpPrompt
            key={location.gpsIssue ?? 'no-gps-issue'}
            {...detectCheckInEnvironment(
              userAgent,
              typeof navigator === 'undefined' ? 0 : navigator.maxTouchPoints
            )}
            gpsIssue={location.gpsIssue}
          />
        </>
      )}

      {requirements.dynamicQr ? (
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
      ) : !requirements.requireLocation && (
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
      )}
    </>
  );
}

function GpsGuidance({ event, location }: { event: CheckInEvent; location: LocationState }) {
  if (location.gpsReady && location.coords) {
    return (
      <div
        className={`flex items-start justify-between gap-2 rounded-xl border p-3 text-xs font-medium sm:items-center ${
          location.isWithinRadius
            ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
            : 'border-amber-200 bg-amber-50 text-amber-800'
        }`}
      >
        <div className="flex items-center gap-2">
          <MapPin className={`h-4 w-4 shrink-0 ${location.isWithinRadius ? 'text-emerald-600' : 'text-amber-600'}`} />
          <span>
            {location.currentDistance !== null
              ? `Cách sự kiện ~${location.currentDistance}m (${
                  location.isWithinRadius ? 'Hợp lệ' : `Vượt quá ${event.radius_meters}m`
                })`
              : `Đã định vị GPS (${location.coords.lat.toFixed(4)}, ${location.coords.lng.toFixed(4)})`}
          </span>
        </div>
        <button
          type="button"
          onClick={location.requestLocation}
          className="min-h-10 shrink-0 rounded-lg px-2 text-[11px] underline opacity-80 hover:opacity-100"
          title="Cập nhật lại GPS"
        >
          Làm mới
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-start justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-medium text-amber-800 sm:items-center">
      <div className="flex items-center gap-2">
        <Navigation className="h-4 w-4 shrink-0 animate-spin text-amber-600" />
        <span role="status" aria-live="polite">
          {location.isRequestingLocation
            ? location.isRefiningLocation
              ? 'Đang xác minh vị trí chính xác...'
              : 'Đang chờ quyền và xác minh vị trí...'
            : location.gpsError || 'Cần cho phép truy cập vị trí để tiếp tục.'}
        </span>
      </div>
      <button
        type="button"
        disabled={location.isRequestingLocation}
        onClick={location.requestLocation}
        className="min-h-10 shrink-0 rounded-lg px-2 text-[11px] font-semibold underline disabled:cursor-wait disabled:opacity-50"
      >
        {location.isRequestingLocation
          ? 'Đang xác minh...'
          : location.gpsError
            ? 'Thử lại'
            : 'Cho phép vị trí'}
      </button>
    </div>
  );
}
