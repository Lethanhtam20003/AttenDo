'use client';

import dynamic from 'next/dynamic';
import { Navigation, Plus, Trash2, GripVertical, ArrowRight, ShieldCheck, Loader2 } from 'lucide-react';
import { useHostSetupForm } from '@/hooks/host-setup/useHostSetupForm';
import { useHostSetupLocation } from '@/hooks/host-setup/useHostSetupLocation';
import { useCustomFields } from '@/hooks/host-setup/useCustomFields';

const MapSelector = dynamic(() => import('@/components/host/MapSelector'), {
  ssr: false,
  loading: () => <div className="h-[280px] w-full bg-slate-100 animate-pulse rounded-xl" />,
});

export default function HostSetupPage() {
  const location = useHostSetupLocation();
  const customFields = useCustomFields();
  const form = useHostSetupForm(location.coordinates, location.radius, customFields.fields);

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6">
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Cấu hình phiên điểm danh</h1>
          <p className="text-sm text-slate-500 mt-1">Thiết lập Geofencing và thông tin người tham gia trước khi phát sóng.</p>
        </div>
        <button
          type="button"
          onClick={form.handleLaunch}
          disabled={form.isPending}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold text-sm shadow-sm transition-colors"
        >
          {form.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
          {form.isPending ? 'Đang khởi tạo...' : 'Khởi chạy màn hình'}
        </button>
      </div>

      {form.errorMsg && (
        <div className="max-w-4xl mx-auto mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700">
          {form.errorMsg}
        </div>
      )}

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Tên sự kiện */}
        <section className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
          <label htmlFor="event-name" className="block text-sm font-semibold text-slate-900">
            Tên sự kiện / Buổi sinh hoạt <span className="text-rose-500">*</span>
          </label>
          <input
            id="event-name"
            type="text"
            value={form.eventTitle}
            onChange={(e) => form.setEventTitle(e.target.value)}
            placeholder="Ví dụ: Hội thảo Chuyển đổi số 2026, Điểm danh Lớp CNTT K15..."
            className="mt-2 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-colors focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
          />
        </section>

        {/* Vị trí & Bán kính */}
        <section className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
          <div className="flex items-center justify-between pb-5 border-b border-slate-100">
            <div>
              <h2 className="text-base font-semibold text-slate-900">1. Vị trí & Bán kính điểm danh (Geofencing)</h2>
              <p className="text-xs text-slate-500 mt-0.5">Xác định ranh giới bắt buộc khi người tham gia quét QR check-in.</p>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5" />
              GPS Geofence
            </span>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-4">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">Cách 1: Lấy tự động</span>
                <button
                  type="button"
                  onClick={location.handleGetCurrentLocation}
                  disabled={location.isLocating}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-blue-600 text-blue-600 hover:bg-blue-50 font-medium text-xs transition-colors shadow-sm disabled:opacity-50"
                >
                  <Navigation className={`w-3.5 h-3.5 ${location.isLocating ? 'animate-spin' : ''}`} />
                  {location.isLocating ? 'Đang dò GPS...' : 'Lấy vị trí hiện tại của tôi'}
                </button>
                {location.locationError && (
                  <p className="mt-2 text-xs text-rose-600">{location.locationError}</p>
                )}
              </div>

              <div className="pt-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">Bán kính hợp lệ</span>
                <div className="grid grid-cols-3 gap-2">
                  {[50, 100, 200].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => location.setRadius(r)}
                      className={`py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                        location.radius === r
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {r}m
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 font-mono text-xs text-slate-600 space-y-1">
                <div>Lat: <span className="text-slate-900 font-semibold">{location.coordinates.lat.toFixed(5)}</span></div>
                <div>Lng: <span className="text-slate-900 font-semibold">{location.coordinates.lng.toFixed(5)}</span></div>
                <div>Ranh giới: <span className="text-blue-600 font-semibold">{location.radius}m</span></div>
              </div>
            </div>

            <div className="md:col-span-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">Cách 2: Kéo thả trên OpenStreetMap</span>
              <MapSelector
                lat={location.coordinates.lat}
                lng={location.coordinates.lng}
                radius={location.radius}
                onChangeLocation={location.handleMapLocationChange}
              />
            </div>
          </div>
        </section>

        {/* Custom Fields */}
        <section className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
          <div className="flex items-center justify-between pb-5 border-b border-slate-100">
            <div>
              <h2 className="text-base font-semibold text-slate-900">2. Thu thập dữ liệu người tham dự</h2>
              <p className="text-xs text-slate-500 mt-0.5">Tùy biến các câu hỏi/thông tin người quét QR cần nhập.</p>
            </div>
            <button
              type="button"
              onClick={customFields.addField}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-sm transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Thêm câu hỏi
            </button>
          </div>

          <div className="mt-4 divide-y divide-slate-100">
            {customFields.fields.map((field) => (
              <div key={field.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-1">
                  <GripVertical className="w-4 h-4 text-slate-300 shrink-0" />
                  <input
                    type="text"
                    value={field.label}
                    disabled={field.fixed}
                    onChange={(e) => customFields.updateFieldLabel(field.id, e.target.value)}
                    className="text-sm font-medium text-slate-800 bg-transparent border border-transparent hover:border-slate-200 focus:border-blue-600 rounded-lg px-2.5 py-1.5 w-full max-w-sm outline-none transition-colors disabled:hover:border-transparent"
                  />
                  {field.fixed ? (
                    <span className="text-xs px-2 py-1 rounded-md bg-slate-100 text-slate-500 border border-slate-200 font-mono">
                      Văn bản
                    </span>
                  ) : (
                    <select
                      value={field.type}
                      onChange={(e) => customFields.updateFieldType(field.id, e.target.value as 'text' | 'tel' | 'number')}
                      className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-700 outline-none focus:border-blue-600"
                    >
                      <option value="text">Văn bản</option>
                      <option value="tel">Số điện thoại</option>
                      <option value="number">Con số</option>
                    </select>
                  )}
                </div>

                <div className="flex items-center gap-4 pl-6 sm:pl-0">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={field.required}
                      disabled={field.fixed}
                      onChange={(e) => customFields.updateFieldRequired(field.id, e.target.checked)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-600/20"
                    />
                    <span className="text-xs text-slate-600">Bắt buộc</span>
                  </label>
                  {!field.fixed && (
                    <button
                      type="button"
                      onClick={() => customFields.removeField(field.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Xóa câu hỏi"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
