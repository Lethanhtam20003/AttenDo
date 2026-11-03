'use client';

import { Suspense, useState, useSyncExternalStore } from 'react';
import { useParams } from 'next/navigation';
import { MapPin, ShieldAlert, CheckCircle2, Lock, Loader2, Navigation } from 'lucide-react';
import { useCheckinEvent } from '@/hooks/checkin/useCheckinEvent';
import { useCheckinLocation } from '@/hooks/checkin/useCheckinLocation';
import { useCheckinForm } from '@/hooks/checkin/useCheckinForm';
import ZaloBrowserPrompt, { type ZaloPlatform } from '@/components/checkin/ZaloBrowserPrompt';
import type { CustomFieldConfig } from '@/types/database';

function subscribeToBrowser() {
  return () => {};
}

function getUserAgent() {
  return navigator.userAgent;
}

function getZaloPlatform(userAgent: string): ZaloPlatform | null {
  if (!/zalo/i.test(userAgent)) return null;
  if (/android/i.test(userAgent)) return 'android';
  if (/iphone|ipad|ipod/i.test(userAgent)) return 'ios';
  return 'other';
}

function AttendeeCheckinContent() {
  const params = useParams<{ eventId: string }>();
  const eventId = params?.eventId;
  const { event, loading } = useCheckinEvent(eventId);
  const userAgent = useSyncExternalStore(subscribeToBrowser, getUserAgent, () => '');
  const zaloPlatform = getZaloPlatform(userAgent);
  const [continueInZalo, setContinueInZalo] = useState(false);

  const location = useCheckinLocation(
    event,
    !userAgent || (zaloPlatform !== null && !continueInZalo)
  );
  const form = useCheckinForm({
    eventId,
    event,
    gpsReady: location.gpsReady,
    coords: location.coords,
    currentDistance: location.currentDistance,
    isWithinRadius: location.isWithinRadius,
  });

  // ── Màn hình thành công ───────────────────────────────────
  if (form.isSuccess) {
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
            {form.distanceResult !== null && (
              <div className="flex justify-between">
                <span className="text-slate-400">Khoảng cách:</span>
                <span className="text-slate-800">{form.distanceResult}m từ hội trường</span>
              </div>
            )}
            {location.coords && (
              <div className="flex justify-between">
                <span className="text-slate-400">Tọa độ:</span>
                <span className="text-slate-800">
                  {location.coords.lat.toFixed(4)}, {location.coords.lng.toFixed(4)}
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
            onClick={form.handleCheckInAnother}
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

  if (event.status === 'closed') {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center max-w-sm">
          <ShieldAlert className="w-10 h-10 text-amber-500 mx-auto mb-3" />
          <h2 className="text-base font-bold text-slate-900">Phiên điểm danh đã kết thúc</h2>
          <p className="text-xs text-slate-500 mt-1">
            Host đã đóng phiên này. Bạn không thể gửi thêm lượt điểm danh.
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

      {zaloPlatform && !continueInZalo && (
        <ZaloBrowserPrompt
          platform={zaloPlatform}
          onContinue={() => setContinueInZalo(true)}
        />
      )}

      <form onSubmit={form.handleSubmit} className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-4">
        {/* Banner hiển thị vị trí Geofence */}
        {event.module_settings?.require_location === false ? null : location.gpsReady && location.coords ? (
          <div
            className={`p-3 rounded-xl border flex items-center justify-between text-xs font-medium ${
              location.isWithinRadius
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-amber-50 border-amber-200 text-amber-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <MapPin className={`w-4 h-4 shrink-0 ${location.isWithinRadius ? 'text-emerald-600' : 'text-amber-600'}`} />
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
              <span>{location.gpsError || 'Đang xin quyền định vị GPS...'}</span>
            </div>
            {location.gpsError && (
              <button
                type="button"
                onClick={location.requestLocation}
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
              value={form.fieldValues['full_name'] ?? ''}
              onChange={(e) => form.setFieldValues((prev) => ({ ...prev, full_name: e.target.value }))}
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
                value={form.fieldValues[field.key] ?? ''}
                onChange={(e) => form.setFieldValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
                placeholder={`Nhập ${field.label.toLowerCase()}...`}
                className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition-colors"
              />
            </div>
          ))}

          {/* Ô nhập PIN ngẫu nhiên */}
          {event.module_settings?.require_pin !== false && (
            <div className="pt-2">
              <label className="text-xs font-semibold text-slate-700 block mb-1 text-center">
                Mã PIN trên màn hình trình chiếu <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={4}
                required
                value={form.pinInput}
                onChange={(e) => form.setPinInput(e.target.value.replace(/\D/g, ''))}
                placeholder="----"
                className="w-full text-center tracking-[0.5em] font-mono text-2xl font-black px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white placeholder-slate-300 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition-colors"
              />
              <p className="text-[11px] text-slate-400 mt-1 text-center">
                Nhìn lên màn chiếu của Host để lấy mã gồm 4 số.
              </p>
            </div>
          )}
        </div>

        {/* Lỗi submit */}
        {form.submitError && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
            {form.submitError}
          </div>
        )}

        <button
          type="submit"
          disabled={
            (event.module_settings?.require_location !== false &&
              (!location.gpsReady ||
                (!location.isWithinRadius && location.currentDistance !== null))) ||
            form.isSubmitting
          }
          className="w-full mt-4 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600/20 flex items-center justify-center gap-2 cursor-pointer"
        >
          {form.isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {form.isSubmitting
            ? 'Đang gửi điểm danh...'
            : event.module_settings?.require_location !== false &&
              !location.isWithinRadius &&
              location.currentDistance !== null
            ? `Ngoài bán kính (${location.currentDistance}m > ${event.radius_meters}m)`
            : 'Xác nhận có mặt'}
        </button>
      </form>

      <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 py-3">
        <Lock className="w-3 h-3" />
        {event.module_settings?.require_location === false
          ? 'Bảo mật chống gửi trùng bằng Device ID'
          : 'Bảo mật chống gửi trùng bằng Geofence & Device ID'}
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
