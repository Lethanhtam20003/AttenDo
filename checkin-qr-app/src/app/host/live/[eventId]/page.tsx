'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Download, Users, QrCode, ShieldCheck } from 'lucide-react';
import { useSessionStorageState } from '@/hooks/useSessionStorageState';

const DEFAULT_EVENT_NAME = 'Hội thảo Trực quan Hóa Dữ liệu 2026';

interface AttendeeLog {
  id: string;
  name: string;
  phone: string;
  org: string;
  checkInTime: string;
  distance: number;
}

export default function HostLiveScreen() {
  const { eventId } = useParams<{ eventId: string }>();
  const [eventName] = useSessionStorageState(`host-event-name:${eventId}`, DEFAULT_EVENT_NAME);
  const [pin, setPin] = useState('7392');
  const [timeLeft, setTimeLeft] = useState(30);
  const [logs] = useState<AttendeeLog[]>([
    { id: '1', name: 'Nguyễn Văn An', phone: '0901234567', org: 'Viện Công nghệ', checkInTime: '09:28:14', distance: 12 },
    { id: '2', name: 'Trần Thị Thuỷ Tiên', phone: '0912345678', org: 'Khối Truyền Thông', checkInTime: '09:27:50', distance: 34 },
    { id: '3', name: 'Lê Hoàng Long', phone: '0988776655', org: 'Ban Quản lý', checkInTime: '09:27:12', distance: 6 },
  ]);

  // Bộ đếm chu kỳ OTP / PIN ngẫu nhiên 30 giây
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setPin(Math.floor(1000 + Math.random() * 9000).toString());
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleExportExcel = () => {
    alert('Đang trích xuất toàn bộ dữ liệu ra file Excel (.xlsx)...');
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
              <h1 className="text-sm font-bold text-slate-900 tracking-tight">{eventName}</h1>
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
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Xuất file Excel (.xlsx)
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

            {/* Khung hiển thị QR code */}
            <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-inner mb-3">
              <div className="w-48 h-48 bg-slate-900 rounded-xl flex flex-col items-center justify-center text-white text-xs gap-2">
                <QrCode className="w-12 h-12 text-slate-300" />
                <span className="text-[11px] text-slate-400">checkin.app/checkin/{eventId || 'evt-88219'}</span>
              </div>
            </div>

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
                  style={{ width: `${(timeLeft / 30) * 100}%` }}
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
                Đã vào phòng: <span className="text-slate-900 font-bold">{logs.length}</span>
              </span>
            </div>

            <div className="overflow-y-auto divide-y divide-slate-100 flex-1 max-h-[540px]">
              {logs.map((item) => (
                <div key={item.id} className="p-4 flex items-center justify-between hover:bg-slate-50/70 transition-colors">
                  <div className="flex items-center gap-3.5">
                    <div className="w-9 h-9 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center font-bold text-blue-600 text-xs">
                      {item.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 leading-tight">{item.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{item.org} • {item.phone}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-mono font-medium text-slate-800 block">{item.checkInTime}</span>
                    <span className="text-[11px] font-medium text-emerald-600 flex items-center justify-end gap-1 mt-0.5">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Cách {item.distance}m (Hợp lệ)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
