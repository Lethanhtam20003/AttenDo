'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { MapPin, ShieldAlert, CheckCircle2, Lock } from 'lucide-react';

export default function AttendeeCheckinPage() {
  const params = useParams<{ eventId: string }>();
  const eventId = params?.eventId;

  const [gpsReady, setGpsReady] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [org, setOrg] = useState('');
  const [pinInput, setPinInput] = useState('');

  // Tự động xin quyền GPS khi vào trang
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setGpsReady(true);
        },
        () => {
          setGpsReady(false);
          setErrorMessage('Vui lòng bật quyền truy cập GPS để xác nhận vị trí.');
        },
        { enableHighAccuracy: true }
      );
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gpsReady || !coords) {
      alert('Chưa lấy được tọa độ GPS của bạn.');
      return;
    }
    setIsSubmitting(true);

    // Mock kiểm tra Geofence và Dynamic PIN
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      // Khóa thiết bị trong LocalStorage để tránh gửi trùng
      if (eventId) {
        localStorage.setItem(`checkedin_${eventId}`, 'true');
      }
    }, 800);
  };

  if (isSuccess) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6 w-full max-w-sm text-center">
          <div className="w-12 h-12 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">Điểm danh thành công!</h1>
          <p className="text-xs text-slate-500 mt-1">Vị trí và thời gian của bạn đã được ghi nhận trên hệ thống Host.</p>
          
          <div className="mt-5 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600 text-left space-y-1.5 font-mono">
            <div className="flex justify-between">
              <span className="text-slate-400">Trạng thái:</span>
              <span className="text-emerald-600 font-semibold">Đã xác minh GPS</span>
            </div>
            {coords && (
              <div className="flex justify-between">
                <span className="text-slate-400">Tọa độ:</span>
                <span className="text-slate-800">{coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-400">Thiết bị:</span>
              <span className="text-slate-800">Đã khóa gửi trùng</span>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col justify-between p-4 max-w-md mx-auto">
      <div className="text-center pt-4 pb-2">
        <h1 className="text-lg font-bold text-slate-900 tracking-tight">Check-in Điểm danh</h1>
        <p className="text-xs text-slate-500 mt-0.5">Sự kiện: Hội thảo Trực quan Hóa Dữ liệu 2026</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-4">
        {/* Banner trạng thái GPS */}
        {gpsReady && coords ? (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800 text-xs font-medium">
            <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Đã định vị ({coords.lat.toFixed(4)}, {coords.lng.toFixed(4)})</span>
          </div>
        ) : (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2 text-amber-800 text-xs font-medium">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{errorMessage || 'Đang xin quyền định vị GPS...'}</span>
          </div>
        )}

        <div className="space-y-3 pt-1">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Họ và tên <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nguyễn Văn A"
              className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition-colors"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Số điện thoại <span className="text-rose-500">*</span>
            </label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0912 345 678"
              className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition-colors"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Đơn vị công tác
            </label>
            <input
              type="text"
              value={org}
              onChange={(e) => setOrg(e.target.value)}
              placeholder="Nhập tên trường/công ty..."
              className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition-colors"
            />
          </div>

          {/* Ô nhập PIN ngẫu nhiên */}
          <div className="pt-2">
            <label className="text-xs font-semibold text-slate-700 block mb-1 text-center">
              Mã PIN trên màn hình trình chiếu <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              maxLength={4}
              required
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              placeholder="----"
              className="w-full text-center tracking-[0.5em] font-mono text-xl font-black px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white placeholder-slate-300 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition-colors"
            />
            <p className="text-[11px] text-slate-400 mt-1 text-center">
              Nhìn lên màn chiếu của Host để lấy mã gồm 4 số.
            </p>
          </div>
        </div>

        <button
          type="submit"
          disabled={!gpsReady || isSubmitting}
          className="w-full mt-4 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600/20 disabled:opacity-50"
        >
          {isSubmitting ? 'Đang xác minh tọa độ...' : 'Xác nhận có mặt'}
        </button>
      </form>

      <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 py-3">
        <Lock className="w-3 h-3" />
        Bảo mật chống gửi trùng bằng Geofence & Device ID
      </div>
    </main>
  );
}
