'use client';

import { Suspense } from 'react';
import { useParams } from 'next/navigation';
import { QRCodeCanvas } from 'qrcode.react';
import { Download, Users, QrCode, ShieldCheck, Loader2 } from 'lucide-react';
import { PIN_INTERVAL_SEC, useHostLiveSession } from '@/hooks/useHostLiveSession';
import { useAttendanceBoard } from '@/hooks/useAttendanceBoard';

function HostLiveContent() {
  const { eventId } = useParams<{ eventId: string }>();
  const { event, pin, timeLeft, checkinUrl, handleRotatePin } = useHostLiveSession(eventId);
  const { logs, newAttendeeId, handleExportExcel } = useAttendanceBoard(eventId, event);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Header Glassmorphism */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-30 px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
              Q
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-900 tracking-tight">
                {event?.title || 'Đang kết nối sự kiện...'}
              </h1>
              <span className="text-xs text-slate-400 font-mono">Phiên: #{eventId}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Supabase Realtime Live
            </span>
            <button
              type="button"
              onClick={handleExportExcel}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Xuất file (.csv / Excel)
            </button>
          </div>
        </div>
      </header>

      {/* Main Grid: Máy chiếu & Trực tiếp */}
      <main className="max-w-7xl mx-auto p-6 flex-1 w-full grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Cột trái: QR Code & Dynamic PIN (Chiếm 5/12 cột) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 flex flex-col items-center text-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-medium mb-5">
              <QrCode className="w-3.5 h-3.5 text-blue-600" />
              Quét mã bằng camera điện thoại
            </div>

            {/* QR Code thực tế */}
            <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-inner mb-3">
              {checkinUrl ? (
                <QRCodeCanvas
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
            {checkinUrl && (
              <p className="text-[11px] text-slate-400 font-mono break-all px-2 select-all">
                {checkinUrl}
              </p>
            )}

            {/* Dynamic PIN ngẫu nhiên */}
            <div className="w-full mt-4 pt-5 border-t border-slate-100 flex flex-col items-center">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Mã xác nhận bảo mật (Đổi sau {timeLeft}s)
              </span>

              <div className="w-full bg-slate-50 border border-slate-200/80 px-6 py-4 rounded-xl flex items-center justify-center">
                <span className="font-mono text-5xl font-black tracking-widest text-slate-900">
                  {pin}
                </span>
              </div>

              <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
                <div
                  className="bg-blue-600 h-full rounded-full transition-all duration-1000 ease-linear"
                  style={{ width: `${(timeLeft / PIN_INTERVAL_SEC) * 100}%` }}
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
          </div>
        </div>

        <div className="lg:col-span-7 flex flex-col">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm flex-1 flex flex-col overflow-hidden">
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
                  <p>Chưa có ai điểm danh. Đang chờ người tham gia quét mã...</p>
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
