'use client';

import { Suspense, useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { MapPin, ShieldAlert, CheckCircle2, Lock, Loader2, Navigation } from 'lucide-react';
import { checkIn } from '@/actions/checkin';
import { getEvent } from '@/actions/events';
import type { CustomFieldConfig, Event } from '@/types/database';

/** Công thức Haversine tính khoảng cách phía client (mét) */
function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Sinh device_id ổn định từ localStorage */
function getDeviceId(): string {
  if (typeof window === 'undefined') return '';
  const KEY = 'attendo_device_id';
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(KEY, id);
  }
  return id;
}

function AttendeeCheckinContent() {
  const params = useParams<{ eventId: string }>();
  const eventId = params?.eventId;

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [gpsReady, setGpsReady] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);

  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [pinInput, setPinInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [distanceResult, setDistanceResult] = useState<number | null>(null);

  // ── Load thông tin sự kiện & kiểm tra localStorage ────────
  useEffect(() => {
    if (!eventId) return;

    // Kiểm tra xem thiết bị này đã từng check-in sự kiện này chưa
    const hasCheckedIn = localStorage.getItem(`checkedin_${eventId}`);
    if (hasCheckedIn) {
      Promise.resolve().then(() => setIsSuccess(true));
    }

    getEvent(eventId).then((data) => {
      setEvent(data as Event | null);
      setLoading(false);
    });
  }, [eventId]);

  // ── Xin quyền GPS khi người dùng bấm hoặc khởi tạo ────────
  const requestLocation = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setGpsError('Trình duyệt của bạn không hỗ trợ định vị GPS.');
      return;
    }
    setGpsError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGpsReady(true);
      },
      () => {
        setGpsReady(false);
        setGpsError('Vui lòng bật quyền truy cập GPS để xác nhận vị trí của bạn.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);

  useEffect(() => {
    if (!('geolocation' in navigator)) {
      const timer = setTimeout(() => {
        setGpsError('Trình duyệt của bạn không hỗ trợ định vị GPS.');
      }, 0);
      return () => clearTimeout(timer);
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGpsReady(true);
      },
      () => {
        setGpsReady(false);
        setGpsError('Vui lòng bật quyền truy cập GPS để xác nhận vị trí của bạn.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);

  // Tính khoảng cách thời gian thực giữa người dùng và vị trí sự kiện
  const currentDistance =
    coords && event?.location_lat != null && event?.location_lng != null
      ? Math.round(calculateDistance(event.location_lat, event.location_lng, coords.lat, coords.lng))
      : null;

  const isWithinRadius =
    currentDistance === null || (event ? currentDistance <= (event.radius_meters || 100) : true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gpsReady || !coords || !eventId) {
      setSubmitError('Chưa xác định được vị trí GPS của bạn. Vui lòng bật định vị.');
      return;
    }

    if (!isWithinRadius && event) {
      setSubmitError(
        `Bạn đang ở cách địa điểm ~${currentDistance}m (Vượt quá bán kính cho phép ${event.radius_meters}m). Vui lòng di chuyển đến gần hội trường.`
      );
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    const fullName = fieldValues['full_name'] ?? '';
    const customData = { ...fieldValues };

    const result = await checkIn({
      eventId,
      fullName,
      customData,
      userLat: coords.lat,
      userLng: coords.lng,
      pinInput,
      deviceId: getDeviceId(),
    });

    setIsSubmitting(false);

    if (!result.success) {
      setSubmitError(result.error);
      return;
    }

    // Lưu cờ vào localStorage để khóa gửi trùng
    localStorage.setItem(`checkedin_${eventId}`, 'true');
    setDistanceResult(result.data.distance_meters);
    setIsSuccess(true);
  };

  // ── Màn hình thành công ───────────────────────────────────
  if (isSuccess) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6 w-full max-w-sm text-center">
          <div className="w-14 h-14 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Điểm danh thành công!</h1>
          <p className="text-xs text-slate-500 mt-1">
            Thông tin, vị trí và thời gian của bạn đã được ghi nhận trên hệ thống Host.
          </p>

          <div className="mt-5 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600 text-left space-y-2 font-mono">
            <div className="flex justify-between">
              <span className="text-slate-400">Trạng thái:</span>
              <span className="text-emerald-600 font-semibold">Đã xác minh GPS</span>
            </div>
            {distanceResult !== null && (
              <div className="flex justify-between">
                <span className="text-slate-400">Khoảng cách:</span>
                <span className="text-slate-800">{distanceResult}m từ hội trường</span>
              </div>
            )}
            {coords && (
              <div className="flex justify-between">
                <span className="text-slate-400">Tọa độ:</span>
                <span className="text-slate-800">
                  {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-400">Thiết bị:</span>
              <span className="text-slate-800">Đã khóa gửi trùng</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              if (confirm('Bạn có chắc muốn hủy lưu để người khác điểm danh trên thiết bị này?')) {
                localStorage.removeItem(`checkedin_${eventId}`);
                setIsSuccess(false);
              }
            }}
            className="mt-5 text-xs text-blue-600 hover:underline cursor-pointer"
          >
            Điểm danh người khác trên máy này
          </button>
        </div>
      </main>
    );
  }

  // ── Loading ───────────────────────────────────────────────
  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-xs text-slate-500 font-medium">Đang tải thông tin phiên điểm danh...</p>
      </main>
    );
  }

  if (!event) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center max-w-sm">
          <ShieldAlert className="w-10 h-10 text-amber-500 mx-auto mb-3" />
          <h2 className="text-base font-bold text-slate-900">Phiên không tồn tại</h2>
          <p className="text-xs text-slate-500 mt-1">
            Mã sự kiện không đúng hoặc phiên điểm danh đã kết thúc.
          </p>
        </div>
      </main>
    );
  }

  const dynamicFields = event.custom_fields.filter((f) => f.key !== 'full_name');

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col justify-between p-4 max-w-md mx-auto">
      <div className="text-center pt-4 pb-2">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Check-in Điểm Danh</h1>
        <p className="text-xs text-slate-500 mt-0.5 font-medium">{event.title}</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-4">
        {/* Banner hiển thị vị trí Geofence */}
        {gpsReady && coords ? (
          <div
            className={`p-3 rounded-xl border flex items-center justify-between text-xs font-medium ${
              isWithinRadius
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-amber-50 border-amber-200 text-amber-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <MapPin className={`w-4 h-4 shrink-0 ${isWithinRadius ? 'text-emerald-600' : 'text-amber-600'}`} />
              <span>
                {currentDistance !== null
                  ? `Cách sự kiện ~${currentDistance}m (${
                      isWithinRadius ? 'Hợp lệ' : `Vượt quá ${event.radius_meters}m`
                    })`
                  : `Đã định vị GPS (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})`}
              </span>
            </div>
            <button
              type="button"
              onClick={requestLocation}
              className="text-[11px] underline opacity-80 hover:opacity-100 cursor-pointer"
              title="Cập nhật lại GPS"
            >
              Làm mới
            </button>
          </div>
        ) : (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-amber-800 text-xs font-medium">
            <div className="flex items-center gap-2">
              <Navigation className="w-4 h-4 text-amber-600 shrink-0 animate-spin" />
              <span>{gpsError || 'Đang xin quyền định vị GPS...'}</span>
            </div>
            {gpsError && (
              <button
                type="button"
                onClick={requestLocation}
                className="text-[11px] underline font-semibold cursor-pointer"
              >
                Thử lại
              </button>
            )}
          </div>
        )}

        <div className="space-y-3 pt-1">
          {/* Họ và tên – luôn hiển thị đầu tiên */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Họ và tên <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={fieldValues['full_name'] ?? ''}
              onChange={(e) => setFieldValues((prev) => ({ ...prev, full_name: e.target.value }))}
              placeholder="Nguyễn Văn A"
              className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition-colors"
            />
          </div>

          {/* Dynamic fields từ event.custom_fields */}
          {dynamicFields.map((field: CustomFieldConfig) => (
            <div key={field.key}>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                {field.label}
                {field.required && <span className="text-rose-500"> *</span>}
              </label>
              <input
                type={field.type === 'tel' ? 'tel' : field.type === 'number' ? 'number' : 'text'}
                required={field.required}
                value={fieldValues[field.key] ?? ''}
                onChange={(e) => setFieldValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
                placeholder={`Nhập ${field.label.toLowerCase()}...`}
                className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition-colors"
              />
            </div>
          ))}

          {/* Ô nhập PIN ngẫu nhiên */}
          <div className="pt-2">
            <label className="text-xs font-semibold text-slate-700 block mb-1 text-center">
              Mã PIN trên màn hình trình chiếu <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={4}
              required
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
              placeholder="----"
              className="w-full text-center tracking-[0.5em] font-mono text-2xl font-black px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white placeholder-slate-300 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition-colors"
            />
            <p className="text-[11px] text-slate-400 mt-1 text-center">
              Nhìn lên màn chiếu của Host để lấy mã gồm 4 số.
            </p>
          </div>
        </div>

        {/* Lỗi submit */}
        {submitError && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
            {submitError}
          </div>
        )}

        <button
          type="submit"
          disabled={!gpsReady || isSubmitting || (!isWithinRadius && currentDistance !== null)}
          className="w-full mt-4 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600/20 flex items-center justify-center gap-2 cursor-pointer"
        >
          {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {isSubmitting
            ? 'Đang xác minh tọa độ...'
            : !isWithinRadius && currentDistance !== null
            ? `Ngoài bán kính (${currentDistance}m > ${event.radius_meters}m)`
            : 'Xác nhận có mặt'}
        </button>
      </form>

      <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 py-3">
        <Lock className="w-3 h-3" />
        Bảo mật chống gửi trùng bằng Geofence & Device ID
      </div>
    </main>
  );
}

export default function AttendeeCheckinPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            <p className="text-xs text-slate-500 font-medium">Đang tải thông tin điểm danh...</p>
          </div>
        </main>
      }
    >
      <AttendeeCheckinContent />
    </Suspense>
  );
}
