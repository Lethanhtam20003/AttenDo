'use client';

import { Suspense, useState } from 'react';
import { useParams } from 'next/navigation';
import { QRCodeCanvas } from 'qrcode.react';
import { AlertTriangle, CheckCircle2, Download, Loader2, MapPin, Maximize2, QrCode, Share2, ShieldCheck, Users, X } from 'lucide-react';
import { useHostLiveSession } from '@/hooks/host-live/useHostLiveSession';
import {
  getPinRefreshSeconds,
  getQrTokenRefreshSeconds,
} from '@/constants/checkin';
import { useAttendanceBoard } from '@/hooks/host-live/useAttendanceBoard';

function HostLiveContent() {
  const { eventId } = useParams<{ eventId: string }>();
  const {
    event,
    pin,
    timeLeft,
    checkinUrl,
    qrTimeLeft,
    qrError,
    handleRotatePin,
    handleEndEvent,
    isEnding,
    endError,
  } = useHostLiveSession(eventId);
  const { logs, newAttendeeId, handleExportExcel } = useAttendanceBoard(eventId, event);
  const [showEndConfirmation, setShowEndConfirmation] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [isSharingQr, setIsSharingQr] = useState(false);
  const [shareMessage, setShareMessage] = useState<string | null>(null);
  const [shareError, setShareError] = useState<string | null>(null);
  const [copyFallbackUrl, setCopyFallbackUrl] = useState(false);
  const pinRefreshSeconds = getPinRefreshSeconds(
    event?.module_settings?.pin_interval_seconds
  );

  const handleShareQr = async () => {
    if (!checkinUrl || isSharingQr) return;

    setIsSharingQr(true);
    setShareMessage(null);
    setShareError(null);
    setCopyFallbackUrl(false);

    try {
      const canvas = document.getElementById('checkin-qr-code');
      if (!(canvas instanceof HTMLCanvasElement)) {
        throw new Error('Chưa có mã QR để chia sẻ. Vui lòng đợi mã QR tải xong.');
      }

      const image = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Không thể tạo ảnh mã QR để chia sẻ.'));
        }, 'image/png');
      });

      const qrFile = new File([image], 'ma-diem-danh.png', { type: 'image/png' });
      const shareData: ShareData = {
        title: `Mã QR điểm danh - ${event?.title ?? 'Phiên điểm danh'}`,
        text: `Quét mã QR để điểm danh${event?.title ? `: ${event.title}` : ''}.`,
        url: checkinUrl,
      };

      if (navigator.share && navigator.canShare?.({ files: [qrFile] })) {
        await navigator.share({ ...shareData, files: [qrFile] });
        setShareMessage('Đã mở bảng chia sẻ. Chọn Zalo để gửi ảnh mã QR.');
      } else if (navigator.share) {
        await navigator.share(shareData);
        setShareMessage('Đã mở bảng chia sẻ. Chọn Zalo để gửi liên kết check-in.');
      } else {
        await navigator.clipboard.writeText(checkinUrl);
        setShareMessage('Thiết bị chưa hỗ trợ chia sẻ trực tiếp. Đã sao chép liên kết check-in để bạn gửi qua Zalo.');
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return;

      try {
        await navigator.clipboard.writeText(checkinUrl);
        setShareMessage('Không thể chia sẻ mã QR trực tiếp. Đã sao chép liên kết check-in để bạn gửi qua Zalo.');
      } catch {
        setShareError(
          error instanceof Error
            ? `${error.message} Không thể mở chia sẻ hoặc sao chép liên kết trên thiết bị này.`
            : 'Không thể chia sẻ mã QR hoặc sao chép liên kết trên thiết bị này.'
        );
        setCopyFallbackUrl(true);
      }
    } finally {
      setIsSharingQr(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Header Glassmorphism */}
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 px-3 py-3 backdrop-blur-md sm:px-6 sm:py-3.5">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
              Q
            </div>
            <div>
              <h1 className="break-words text-sm font-bold tracking-tight text-slate-900">
                {event?.title || 'Đang kết nối sự kiện...'}
              </h1>
              <span className="block truncate text-xs text-slate-400">Trung tâm Cung ứng Dịch vụ công xã Xuân Sơn · Phiên #{eventId}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            {/* <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Supabase Realtime Live
            </span> */}
            <button
              type="button"
              onClick={handleExportExcel}
              className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 sm:flex-none sm:px-4"
            >
              <Download className="w-3.5 h-3.5" />
              Xuất file (.csv / Excel)
            </button>
            {event?.status === 'closed' ? (
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700">
                <CheckCircle2 className="h-4 w-4" />
                Đã kết thúc
              </span>
            ) : event?.status === 'active' ? (
              <button
                type="button"
                onClick={() => setShowEndConfirmation(true)}
                className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-rose-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-rose-700 sm:flex-none sm:px-4"
              >
                Kết thúc điểm danh
              </button>
            ) : null}
          </div>
        </div>
      </header>

      {showEndConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="end-event-title"
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-600">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h2 id="end-event-title" className="text-lg font-bold text-slate-900">
                  Kết thúc phiên điểm danh?
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  Người tham gia sẽ không thể check-in tiếp. Danh sách hiện có vẫn được giữ lại để xem và xuất file.
                </p>
              </div>
              <button
                type="button"
                aria-label="Đóng hộp thoại"
                onClick={() => setShowEndConfirmation(false)}
                disabled={isEnding}
                className="ml-auto rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {endError && (
              <p role="alert" className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">
                {endError}
              </p>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowEndConfirmation(false)}
                disabled={isEnding}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (await handleEndEvent()) setShowEndConfirmation(false);
                }}
                disabled={isEnding}
                className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isEnding && <Loader2 className="h-4 w-4 animate-spin" />}
                {isEnding ? 'Đang kết thúc...' : 'Xác nhận kết thúc'}
              </button>
            </div>
          </section>
        </div>
      )}

      {showQrModal && checkinUrl && event?.status === 'active' && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4"
          onMouseDown={(mouseEvent) => {
            if (mouseEvent.target === mouseEvent.currentTarget) setShowQrModal(false);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="enlarged-qr-title"
            className="w-full max-w-lg rounded-3xl bg-white p-5 text-center shadow-2xl sm:p-8"
          >
            <div className="flex items-center justify-between gap-4">
              <h2 id="enlarged-qr-title" className="text-lg font-bold text-slate-900">
                Mã QR điểm danh
              </h2>
              <button
                type="button"
                aria-label="Đóng mã QR phóng to"
                onClick={() => setShowQrModal(false)}
                className="rounded-full p-2 text-slate-500 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-5 flex w-full justify-center rounded-2xl border border-slate-200 bg-white p-3">
              <QRCodeCanvas
                value={checkinUrl}
                size={360}
                level="M"
                includeMargin
                aria-label="Mã QR điểm danh phóng to"
                className="h-auto w-full max-w-[360px]"
              />
            </div>
            {event.module_settings?.dynamic_qr === true && (
              <p className="mt-3 text-xs font-medium text-amber-700">
                Mã tự làm mới sau {qrTimeLeft}s. Hãy quét mã đang hiển thị trên màn hình.
              </p>
            )}
          </section>
        </div>
      )}

      {/* Main Grid: Máy chiếu & Trực tiếp */}
      <main className="mx-auto grid w-full max-w-7xl flex-1 grid-cols-1 items-stretch gap-4 p-3 sm:gap-6 sm:p-6 lg:grid-cols-12">
        {/* Cột trái: QR Code & Dynamic PIN (Chiếm một nửa màn hình) */}
        <div className="lg:col-span-6 flex flex-col">
          <div className="flex flex-1 flex-col items-center rounded-2xl border border-slate-200/80 bg-white p-4 text-center shadow-sm sm:p-6">
            {event?.status === 'closed' ? (
              <div className="flex flex-1 flex-col items-center justify-center py-12">
                <CheckCircle2 className="h-12 w-12 text-emerald-600" />
                <h2 className="mt-4 text-lg font-bold text-slate-900">Đã kết thúc điểm danh</h2>
                <p className="mt-2 max-w-sm text-sm text-slate-500">
                  Mã QR và PIN đã bị vô hiệu hóa. Danh sách điểm danh vẫn được lưu để xem hoặc xuất file.
                </p>
              </div>
            ) : (
              <>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-medium mb-5">
              <QrCode className="w-3.5 h-3.5 text-blue-600" />
              Quét mã bằng camera điện thoại
            </div>

            {/* QR Code thực tế */}
            <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-inner mb-3">
              {checkinUrl ? (
                <QRCodeCanvas
                  id="checkin-qr-code"
                  value={checkinUrl}
                  size={200}
                  level="M"
                  includeMargin
                  aria-label="Mã QR điểm danh"
                />
              ) : (
                <div className="w-48 h-48 bg-slate-100 rounded-xl flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
                </div>
              )}
            </div>
            <div className="mb-3 flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              <button
                type="button"
                onClick={() => setShowQrModal(true)}
                disabled={!checkinUrl}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Maximize2 className="h-4 w-4" />
                Phóng to mã QR
              </button>
              <button
                type="button"
                onClick={() => void handleShareQr()}
                disabled={!checkinUrl || isSharingQr}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSharingQr ? <Loader2 className="h-4 w-4 animate-spin" /> : <Share2 className="h-4 w-4" />}
                {isSharingQr ? 'Đang mở chia sẻ...' : 'Chia sẻ QR / Zalo'}
              </button>
            </div>
            {shareMessage && (
              <p role="status" className="mb-2 max-w-md text-xs text-emerald-700">
                {shareMessage}
              </p>
            )}
            {shareError && (
              <div className="mb-2 max-w-md">
                <p role="alert" className="text-xs text-rose-700">{shareError}</p>
                {copyFallbackUrl && (
                  <input
                    aria-label="Liên kết check-in để sao chép thủ công"
                    readOnly
                    value={checkinUrl}
                    onFocus={(inputEvent) => inputEvent.currentTarget.select()}
                    className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900"
                  />
                )}
              </div>
            )}
            {event?.module_settings?.require_location === true && (
              <div className="mb-3 flex max-w-md items-start gap-2 rounded-xl border border-blue-100 bg-blue-50 p-3 text-left">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-blue-700" />
                <p className="text-xs leading-relaxed text-blue-900">
                  <strong>Nhắc người tham dự:</strong> cần bật Dịch vụ vị trí và cho phép Zalo/trình duyệt truy cập vị trí để điểm danh. iPhone: bật tại Cài đặt → Quyền riêng tư &amp; Bảo mật → Dịch vụ định vị. Android: bật Vị trí trong Cài đặt và cấp quyền vị trí cho ứng dụng đang quét QR.
                </p>
              </div>
            )}
            {checkinUrl && (
              event?.module_settings?.dynamic_qr === true ? (
                <p className="text-xs text-slate-500">
                  Mã QR tự đổi sau {getQrTokenRefreshSeconds(event.module_settings.dynamic_qr_interval_seconds)} giây · còn {qrTimeLeft}s
                </p>
              ) : (
                <p className="text-[11px] text-slate-400 font-mono break-all px-2 select-all">
                  {checkinUrl}
                </p>
              )
            )}
            {event?.module_settings?.dynamic_qr === true && (
              <p className="mt-2 max-w-md text-[11px] leading-relaxed text-amber-700">
                Mã QR động chỉ có hiệu lực trong thời gian ngắn. Người nhận cần quét ngay; khi chia sẻ mã, hãy gửi ảnh QR hiện tại.
              </p>
            )}
            {qrError && (
              <p role="alert" className="mt-2 text-xs text-rose-600">
                {qrError}
              </p>
            )}

            {/* Dynamic PIN ngẫu nhiên */}
            {event?.module_settings?.require_pin !== false && (
              <div className="w-full mt-4 pt-5 border-t border-slate-100 flex flex-col items-center">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Mã PIN tự đổi sau {pinRefreshSeconds}s · còn {timeLeft}s
                </span>

                <div className="w-full bg-slate-50 border border-slate-200/80 px-6 py-4 rounded-xl flex items-center justify-center">
                  <span className="font-mono text-5xl font-black tracking-widest text-slate-900">
                    {pin}
                  </span>
                </div>

                <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
                  <div
                    className="bg-blue-600 h-full rounded-full transition-all duration-1000 ease-linear"
                    style={{ width: `${(timeLeft / pinRefreshSeconds) * 100}%` }}
                  />
                </div>

                <button
                  type="button"
                  onClick={handleRotatePin}
                  className="mt-4 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
                >
                  Đổi mã PIN ngay
                </button>
              </div>
            )}
              </>
            )}
          </div>
        </div>

        <div className="lg:col-span-6 flex flex-col">
          <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Users className="w-5 h-5 text-blue-600" />
                <h2 className="font-semibold text-slate-900">Danh sách có mặt thời gian thực</h2>
              </div>
              <span className="text-xs font-semibold text-slate-500 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                Đã vào phòng: <span className="text-blue-600 font-bold text-sm">{logs.length}</span>
              </span>
            </div>

            <div className="overflow-y-auto divide-y divide-slate-100 flex-1 max-h-[560px]">
              {logs.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-slate-400 text-sm gap-2">
                  <Users className="w-8 h-8 opacity-30" />
                  <p>
                    {event?.status === 'closed'
                      ? 'Phiên đã kết thúc và chưa có lượt điểm danh nào.'
                      : 'Chưa có ai điểm danh. Đang chờ người tham gia quét mã...'}
                  </p>
                </div>
              ) : (
                logs.map((item) => {
                  const isNew = item.id === newAttendeeId;
                  const extraInfo = Object.entries(item.custom_data || {})
                    .filter(([k]) => k !== 'full_name')
                    .map(([, v]) => v)
                    .filter(Boolean)
                    .join(' • ');

                  return (
                    <div
                      key={item.id}
                      className={`p-4 flex items-center justify-between transition-colors duration-500 ${
                        isNew ? 'bg-blue-50/80' : 'hover:bg-slate-50/70'
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center font-bold text-blue-600 text-sm shrink-0">
                          {item.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900 leading-tight">
                            {item.full_name}
                          </p>
                          {extraInfo && (
                            <p className="text-xs text-slate-500 mt-0.5">{extraInfo}</p>
                          )}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs font-mono font-medium text-slate-800 block">
                          {new Date(item.checked_in_at).toLocaleTimeString('vi-VN')}
                        </span>
                        <span className="text-[11px] font-medium text-emerald-600 flex items-center justify-end gap-1 mt-0.5">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          {item.distance_meters !== null
                            ? `Cách ${item.distance_meters}m (Hợp lệ)`
                            : 'Đã xác minh GPS'}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function HostLiveScreen() {
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
      <HostLiveContent />
    </Suspense>
  );
}
