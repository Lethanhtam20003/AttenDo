'use client';

import { Suspense, useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { QRCodeCanvas } from 'qrcode.react';
import { Download, Users, QrCode, ShieldCheck, Loader2 } from 'lucide-react';
import { useRealtimeTable } from '@/hooks/useRealtimeTable';
import { rotatePin, getCurrentPin } from '@/actions/pins';
import { getAttendanceList } from '@/actions/checkin';
import { getEvent } from '@/actions/events';
import type { AttendanceRecord, EventPin, Event } from '@/types/database';

const PIN_INTERVAL_SEC = 30;

function HostLiveContent() {
  const { eventId } = useParams<{ eventId: string }>();

  const [event, setEvent] = useState<Event | null>(null);
  const [pin, setPin] = useState('----');
  const [timeLeft, setTimeLeft] = useState(PIN_INTERVAL_SEC);
  const [logs, setLogs] = useState<AttendanceRecord[]>([]);
  const [checkinUrl, setCheckinUrl] = useState('');
  const [newAttendeeId, setNewAttendeeId] = useState<string | null>(null);

  // ── Khởi tạo dữ liệu ban đầu ──────────────────────────────
  useEffect(() => {
    if (!eventId) return;

    // Tạo URL cho QR Code
    const origin = window.location.origin;
    const url = `${origin}/checkin/${eventId}`;
    Promise.resolve().then(() => setCheckinUrl(url));

    // Load thông tin sự kiện
    getEvent(eventId).then((data) => {
      if (data) setEvent(data as Event);
    });

    // Load mã PIN hiện tại ngay lập tức
    getCurrentPin(eventId).then((res) => {
      if (res.success) {
        setPin(res.data.pin);
        const remaining = Math.max(1, Math.round((new Date(res.data.expiresAt).getTime() - Date.now()) / 1000));
        setTimeLeft(Math.min(remaining, PIN_INTERVAL_SEC));
      }
    });

    // Load danh sách điểm danh ban đầu
    getAttendanceList(eventId).then(setLogs);
  }, [eventId]);

  // ── Quản lý PIN & countdown ──────────────────────────────
  const handleRotatePin = useCallback(async () => {
    if (!eventId) return;
    const result = await rotatePin(eventId);
    if (result.success) {
      setPin(result.data.pin);
      setTimeLeft(PIN_INTERVAL_SEC);
    }
  }, [eventId]);

  // Countdown timer – tự gọi rotatePin khi về 0
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleRotatePin();
          return PIN_INTERVAL_SEC;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [handleRotatePin]);

  // ── Realtime: đồng bộ PIN mới từ server ──────────────────
  useRealtimeTable<EventPin>(
    'event_pins',
    `event_id=eq.${eventId}`,
    'INSERT',
    (payload) => {
      if (payload.new && 'current_pin' in payload.new) {
        setPin(payload.new.current_pin as string);
        setTimeLeft(PIN_INTERVAL_SEC);
      }
    }
  );

  // ── Realtime: cập nhật danh sách điểm danh ngay lập tức ──
  useRealtimeTable<AttendanceRecord>(
    'attendance_records',
    `event_id=eq.${eventId}`,
    'INSERT',
    (payload) => {
      if (payload.new && 'id' in payload.new) {
        const newRecord = payload.new as AttendanceRecord;
        setLogs((prev) => {
          // Tránh duplicate nếu record đã có
          if (prev.some((r) => r.id === newRecord.id)) return prev;
          return [newRecord, ...prev];
        });
        setNewAttendeeId(newRecord.id);
        setTimeout(() => setNewAttendeeId(null), 3000);
      }
    }
  );

  // ── Xuất file CSV/Excel đa năng (UTF-8 BOM hỗ trợ tiếng Việt) ──
  const handleExportExcel = () => {
    if (logs.length === 0) {
      alert('Chưa có dữ liệu người tham gia điểm danh để xuất.');
      return;
    }

    const customFields = event?.custom_fields?.filter((f) => f.key !== 'full_name') ?? [];

    const headers = [
      'STT',
      'Họ và tên',
      ...customFields.map((f) => f.label),
      'Thời gian điểm danh',
      'Khoảng cách GPS (m)',
      'Tọa độ Vĩ độ (Lat)',
      'Tọa độ Kinh độ (Lng)',
      'Mã thiết bị',
    ];

    const escapeCsv = (val: string | number | null | undefined) => {
      const str = String(val ?? '');
      return `"${str.replace(/"/g, '""')}"`;
    };

    const rows = logs.map((r, idx) => [
      escapeCsv(idx + 1),
      escapeCsv(r.full_name),
      ...customFields.map((f) => escapeCsv(r.custom_data?.[f.key] ?? '')),
      escapeCsv(new Date(r.checked_in_at).toLocaleString('vi-VN')),
      escapeCsv(r.distance_meters !== null ? `${r.distance_meters}m` : 'Hợp lệ'),
      escapeCsv(r.user_lat ?? ''),
      escapeCsv(r.user_lng ?? ''),
      escapeCsv(r.device_id ?? ''),
    ]);

    const csvContent = [
      headers.map(escapeCsv).join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\r\n');

    // Thêm \uFEFF (UTF-8 BOM) để Excel tự nhận diện font tiếng Việt không bị lỗi font
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const cleanTitle = (event?.title || 'diem_danh').replace(/[^a-zA-Z0-9_\u00C0-\u024F\u1EA0-\u1EF9]/g, '_');
    a.download = `diem_danh_${cleanTitle}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

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

              {/* Thanh tiến trình Countdown */}
              <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
                <div
                  className="bg-blue-600 h-full rounded-full transition-all duration-1000 ease-linear"
                  style={{ width: `${(timeLeft / PIN_INTERVAL_SEC) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Cột phải: Live Feed danh sách thời gian thực (Chiếm 7/12 cột) */}
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
