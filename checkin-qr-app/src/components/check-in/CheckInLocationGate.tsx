'use client';

import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Compass,
  Copy,
  ExternalLink,
  Loader2,
  MapPin,
  Navigation,
  RefreshCw,
  ShieldAlert,
  X,
} from 'lucide-react';
import type { useCheckInLocation } from '@/hooks/check-in/useCheckInLocation';

export type CheckInLocationController = ReturnType<typeof useCheckInLocation>;

export function CheckInLocationGate({
  location,
}: {
  location: CheckInLocationController;
}) {
  const {
    locationStatus,
    locationErrorCode,
    locationErrorMessage,
    effectiveDistance,
    rawDistance,
    userAccuracy,
    isWithinRadius,
    isLinkCopied,
    isLocationModalOpen,
    hasLowAccuracyOnIOS,
    environment,
    allowedRadiusMeters,
    handleRequestLocation,
    handleOpenInAndroidChrome,
    handleDismissLocationModal,
    handleCopyCheckInLink,
  } = location;

  return (
    <>
      {/* Hộp thoại nổi (Modal) xuất hiện ngay khi vào trang check-in */}
      {isLocationModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="location-permission-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs"
        >
          <div className="relative w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-5 shadow-xl">
            <button
              type="button"
              onClick={handleDismissLocationModal}
              aria-label="Đóng hộp thoại"
              className="absolute right-3.5 top-3.5 rounded-full p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="mx-auto mb-3.5 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 ring-4 ring-blue-50/60">
              <MapPin className="h-7 w-7" />
            </div>

            <div className="text-center">
              <span className="inline-block rounded-full bg-blue-100 px-3 py-0.5 text-[11px] font-bold text-blue-800">
                Bán kính cho phép: {allowedRadiusMeters}m
              </span>
              <h2
                id="location-permission-modal-title"
                className="mt-2 text-lg font-bold tracking-tight text-slate-900"
              >
                Cấp quyền mở vị trí (GPS)
              </h2>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                Hãy bật <span className="font-semibold text-slate-900">Vị trí (GPS)</span> trên điện thoại và nhấn nút bên dưới để xác thực vị trí điểm danh.
              </p>
            </div>

            <div className="mt-5 space-y-2.5">
              <button
                type="button"
                onClick={() => void handleRequestLocation()}
                className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-blue-700 active:scale-[0.99]"
              >
                <Navigation className="h-4 w-4" />
                Cho phép mở vị trí ngay
              </button>

              {environment.isInAppBrowser && environment.isAndroid && (
                <button
                  type="button"
                  onClick={handleOpenInAndroidChrome}
                  className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-xs font-semibold text-blue-800 transition-colors hover:bg-blue-100"
                >
                  <ExternalLink className="h-4 w-4" />
                  Đang mở bằng {environment.browserName} — Chuyển sang Chrome
                </button>
              )}

              <button
                type="button"
                onClick={handleDismissLocationModal}
                className="w-full py-1.5 text-center text-xs font-medium text-slate-400 hover:text-slate-600"
              >
                Điền thông tin trước, bật vị trí sau
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1. Hộp cấp quyền vị trí trên biểu mẫu */}
      {locationStatus === 'idle' && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50/80 p-4 text-slate-900 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs">
              <MapPin className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-bold text-slate-900">
                  Yêu cầu bật vị trí GPS
                </p>
                <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-[11px] font-semibold text-blue-800">
                  Bán kính {allowedRadiusMeters}m
                </span>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">
                Vui lòng mở Vị trí (GPS) trên điện thoại và nhấn nút bên dưới để kiểm tra bán kính điểm danh.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => void handleRequestLocation()}
            className="mt-3.5 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition-all hover:bg-blue-700 active:scale-[0.99]"
          >
            <Navigation className="h-4 w-4" />
            Cho phép mở vị trí
          </button>
        </div>
      )}

      {/* 2. Trạng thái đang lấy/hội tụ tọa độ GPS */}
      {locationStatus === 'requesting' && (
        <div
          role="status"
          className="rounded-2xl border border-blue-200 bg-blue-50/70 p-4 text-blue-950"
        >
          <div className="flex items-start gap-3">
            <Loader2 className="mt-0.5 h-5 w-5 shrink-0 animate-spin text-blue-600" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold">
                {effectiveDistance !== null
                  ? 'Đang hội tụ tín hiệu GPS chính xác nhất...'
                  : 'Đang kiểm tra vị trí GPS...'}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-blue-800">
                {effectiveDistance !== null && userAccuracy !== null
                  ? `Khoảng cách tạm tính: ${effectiveDistance}m (sai số ±${userAccuracy}m). Vui lòng chờ giây lát.`
                  : 'Hãy nhấn "Cho phép / Allow" nếu hộp thoại hỏi quyền vị trí xuất hiện.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 3. Trạng thái lỗi: Thông báo yêu cầu mở Vị trí (GPS) */}
      {locationStatus === 'error' && (
        <div
          role="alert"
          className="space-y-3 rounded-2xl border border-amber-300 bg-amber-50/95 p-4 text-slate-900"
        >
          <div className="flex items-start gap-3">
            {locationErrorCode === 'insecure_context' ? (
              <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
            ) : (
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-amber-950">
                {locationErrorCode === 'insecure_context'
                  ? 'Kết nối HTTP không được phép mở vị trí'
                  : 'Bạn cần mở Vị trí (GPS) trên điện thoại'}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-amber-900">
                {locationErrorMessage}
              </p>
            </div>
          </div>

          {/* Giải pháp cho Android Zalo/FB WebView: Mở bằng Chrome */}
          {environment.isInAppBrowser && environment.isAndroid && (
            <button
              type="button"
              onClick={handleOpenInAndroidChrome}
              className="flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-blue-700"
            >
              <ExternalLink className="h-4 w-4" />
              Mở bằng trình duyệt Chrome
            </button>
          )}

          {/* Giải pháp cho iOS Zalo/FB WebView: Hướng dẫn mở Safari + Sao chép liên kết */}
          {environment.isInAppBrowser && environment.isIOS && (
            <div className="rounded-xl border border-amber-200 bg-white p-3">
              <p className="text-xs font-semibold text-slate-800">
                Nếu đang mở trong {environment.browserName} trên iPhone/iPad:
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-slate-600">
                Nhấn biểu tượng <span className="font-bold text-slate-900">•••</span> ở góc trên bên phải màn hình và chọn{' '}
                <span className="font-bold text-blue-700">&ldquo;Mở bằng Safari&rdquo;</span>.
              </p>
              <button
                type="button"
                onClick={() => void handleCopyCheckInLink()}
                className="mt-2.5 flex min-h-10 w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100"
              >
                {isLinkCopied ? (
                  <>
                    <Check className="h-4 w-4 text-emerald-600" />
                    <span className="text-emerald-700">Đã sao chép liên kết điểm danh</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    <span>Sao chép liên kết</span>
                  </>
                )}
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => void handleRequestLocation()}
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs transition-colors hover:bg-amber-700"
          >
            <RefreshCw className="h-4 w-4" />
            Đã mở vị trí — Thử lại
          </button>
        </div>
      )}

      {/* 4. Trạng thái đã có kết quả tọa độ: Trong bán kính (Hợp lệ) hoặc Ngoài bán kính */}
      {locationStatus === 'success' && isWithinRadius && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-3.5 text-emerald-950">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
              <div>
                <p className="text-xs font-bold text-emerald-900">
                  Vị trí hợp lệ ({effectiveDistance ?? 0}m / {allowedRadiusMeters}m)
                </p>
                <p className="text-[11px] text-emerald-700">
                  Khoảng cách thực: {rawDistance ?? 0}m • Độ chính xác GPS: ±{userAccuracy ?? 0}m
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => void handleRequestLocation()}
              title="Cập nhật lại vị trí"
              className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-emerald-800 transition-colors hover:bg-emerald-100"
            >
              <RefreshCw className="h-3 w-3" />
              Làm mới
            </button>
          </div>
        </div>
      )}

      {locationStatus === 'success' && !isWithinRadius && (
        <div
          role="alert"
          className="space-y-3 rounded-2xl border border-rose-200 bg-rose-50/90 p-4 text-rose-950"
        >
          <div className="flex items-start gap-3">
            <Compass className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-rose-900">
                Bạn đang ở ngoài bán kính điểm danh
              </p>
              <p className="mt-1 text-xs leading-relaxed text-rose-800">
                Khoảng cách sau bù trừ sai số là <span className="font-bold">{effectiveDistance ?? 0}m</span> (cho phép tối đa{' '}
                <span className="font-bold">{allowedRadiusMeters}m</span>, sai số GPS hiện tại ±{userAccuracy ?? 0}m).
              </p>
            </div>
          </div>

          {hasLowAccuracyOnIOS && (
            <div className="rounded-xl border border-rose-200 bg-white p-3 text-[11px] leading-relaxed text-slate-700">
              <p className="font-semibold text-rose-800">
                Phát hiện iPhone/iPad đang tắt &ldquo;Vị trí chính xác&rdquo; (sai số ±{userAccuracy}m):
              </p>
              <p className="mt-1">
                Vui lòng mở <span className="font-semibold text-slate-900">Cài đặt &gt; Quyền riêng tư &amp; Bảo mật &gt; Dịch vụ định vị &gt; {environment.isZalo ? 'Zalo' : 'Trang web Safari'}</span> và gạt bật{' '}
                <span className="font-semibold text-emerald-700">&ldquo;Vị trí chính xác&rdquo; (Precise Location)</span>, sau đó bấm định vị lại.
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={() => void handleRequestLocation()}
            className="flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-rose-700"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Định vị lại vị trí của tôi
          </button>
        </div>
      )}
    </>
  );
}
