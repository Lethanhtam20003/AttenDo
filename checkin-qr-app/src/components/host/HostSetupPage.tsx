'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import { ArrowRight, GripVertical, Loader2, MapPin, Navigation, Plus, QrCode, ScanFace, ShieldCheck, Trash2 } from 'lucide-react';
import {
  PIN_REFRESH_DEFAULT_SECONDS,
  QR_TOKEN_LIFETIME_SECONDS,
} from '@/constants/checkin';
import { useCustomFields } from '@/hooks/host-setup/useCustomFields';
import { useHostSetupForm } from '@/hooks/host-setup/useHostSetupForm';
import { useHostSetupLocation } from '@/hooks/host-setup/useHostSetupLocation';

const MapSelector = dynamic(() => import('@/components/host/MapSelector'), {
  ssr: false,
  loading: () => <div className="h-[280px] w-full animate-pulse rounded-xl bg-slate-100" />,
});

export type HostSetupModule = 'gps' | 'dynamic-qr' | 'qr-pin';

const moduleDetails: Record<HostSetupModule, { title: string; description: string }> = {
  gps: {
    title: 'Điểm danh bằng GPS',
    description: 'Thiết lập vị trí và bán kính cho phép người tham dự check-in.',
  },
  'dynamic-qr': {
    title: 'Điểm danh bằng QR động',
    description: 'Mã QR tự làm mới để hạn chế sử dụng ảnh chụp màn hình.',
  },
  'qr-pin': {
    title: 'Điểm danh bằng QR + PIN',
    description: 'Yêu cầu người tham dự quét QR và nhập mã PIN đang hiển thị.',
  },
};

export function HostSetupPage({ module }: { module: HostSetupModule }) {
  const defaultInterval = module === 'qr-pin' ? PIN_REFRESH_DEFAULT_SECONDS : QR_TOKEN_LIFETIME_SECONDS;
  const [refreshInterval, setRefreshInterval] = useState(String(defaultInterval));
  const location = useHostSetupLocation();
  const customFields = useCustomFields();
  const settings = {
    requireLocation: module === 'gps',
    requirePin: module === 'qr-pin',
    dynamicQr: module === 'dynamic-qr',
    dynamicQrIntervalSeconds: Number(refreshInterval),
    pinIntervalSeconds: Number(refreshInterval),
  };
  const form = useHostSetupForm(
    location.coordinates,
    location.radius,
    customFields.fields,
    settings
  );
  const details = moduleDetails[module];

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6">
      <div className="mx-auto mb-8 flex max-w-4xl flex-col items-stretch justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-blue-700">
            {module === 'gps' ? <MapPin className="h-4 w-4" /> : module === 'dynamic-qr' ? <QrCode className="h-4 w-4" /> : <ScanFace className="h-4 w-4" />}
            Cấu hình giải pháp
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{details.title}</h1>
          <p className="mt-1 text-sm text-slate-500">{details.description}</p>
        </div>
        <button
          type="button"
          onClick={form.handleLaunch}
          disabled={form.isPending}
          className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:opacity-60 sm:min-h-11"
        >
          {form.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
          {form.isPending ? 'Đang khởi tạo...' : 'Khởi chạy màn hình'}
        </button>
      </div>

      {form.errorMsg && (
        <div role="alert" className="mx-auto mb-4 max-w-4xl rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          {form.errorMsg}
        </div>
      )}

      <div className="mx-auto max-w-4xl space-y-6">
        <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <label htmlFor="event-name" className="block text-sm font-semibold text-slate-900">
            Tên sự kiện / Buổi sinh hoạt <span className="text-rose-500">*</span>
          </label>
          <input
            id="event-name"
            type="text"
            value={form.eventTitle}
            onChange={(event) => form.setEventTitle(event.target.value)}
            placeholder="Ví dụ: Hội thảo Chuyển đổi số 2026, Điểm danh Lớp CNTT K15..."
            className="mt-2 min-h-12 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-base text-slate-900 outline-none transition-colors focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 sm:min-h-11 sm:text-sm"
          />
        </section>

        {(module === 'dynamic-qr' || module === 'qr-pin') && (
          <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold text-slate-900">
              Thời gian tự đổi {module === 'qr-pin' ? 'mã PIN' : 'mã QR'}
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Chọn khoảng thời gian {module === 'qr-pin' ? 'mã PIN' : 'mã QR'} được làm mới.
            </p>
            <div className="mt-4 grid grid-cols-3 gap-2 sm:max-w-md">
              {[
                { label: '30 giây', seconds: 30 },
                { label: '1 phút', seconds: 60 },
                { label: '2 phút', seconds: 120 },
              ].map((option) => (
                <button
                  key={option.seconds}
                  type="button"
                  onClick={() => setRefreshInterval(String(option.seconds))}
                  aria-pressed={Number(refreshInterval) === option.seconds}
                  className={`min-h-11 rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${
                    Number(refreshInterval) === option.seconds
                      ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <div className="mt-4 max-w-md">
              <label htmlFor="refresh-interval" className="block text-sm font-medium text-slate-700">
                Hoặc nhập thời gian cụ thể
              </label>
              <div className="mt-2 flex items-center gap-2">
                <input
                  id="refresh-interval"
                  type="number"
                  min={1}
                  max={86400}
                  step={1}
                  value={refreshInterval}
                  onChange={(event) => setRefreshInterval(event.target.value)}
                  className="min-h-11 w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-900 outline-none transition-colors focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
                />
                <span className="text-sm text-slate-500">giây</span>
              </div>
              <p className="mt-1.5 text-xs text-slate-500">Nhập từ 1 đến 86400 giây.</p>
            </div>
          </section>
        )}

        {module === 'gps' && (
          <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-5">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Vị trí & bán kính điểm danh</h2>
                <p className="mt-0.5 text-xs text-slate-500">Chỉ chấp nhận check-in trong ranh giới đã cấu hình.</p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                <ShieldCheck className="h-3.5 w-3.5" />
                GPS Geofence
              </span>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
              <div className="space-y-4">
                <div>
                  <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500">Lấy vị trí</span>
                  <button
                    type="button"
                    onClick={location.handleGetCurrentLocation}
                    disabled={location.isLocating}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-blue-600 px-4 py-2.5 text-xs font-medium text-blue-600 shadow-sm transition-colors hover:bg-blue-50 disabled:opacity-50"
                  >
                    <Navigation className={`h-3.5 w-3.5 ${location.isLocating ? 'animate-spin' : ''}`} />
                    {location.isLocating ? 'Đang dò GPS...' : 'Lấy vị trí hiện tại'}
                  </button>
                  {location.locationError && <p className="mt-2 text-xs text-rose-600">{location.locationError}</p>}
                </div>

                <div className="pt-2">
                  <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500">Bán kính hợp lệ</span>
                  <div className="grid grid-cols-3 gap-2">
                    {[50, 100, 200].map((radius) => (
                      <button
                        key={radius}
                        type="button"
                        onClick={() => location.setRadius(radius)}
                        aria-pressed={location.radius === radius}
                        className={`rounded-xl border py-1.5 text-xs font-medium transition-colors ${
                          location.radius === radius
                            ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {radius}m
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1 rounded-xl border border-slate-200/60 bg-slate-50 p-3 font-mono text-xs text-slate-600">
                  <div>Lat: <span className="font-semibold text-slate-900">{location.coordinates.lat.toFixed(5)}</span></div>
                  <div>Lng: <span className="font-semibold text-slate-900">{location.coordinates.lng.toFixed(5)}</span></div>
                  <div>Ranh giới: <span className="font-semibold text-blue-600">{location.radius}m</span></div>
                </div>
              </div>

              <div className="md:col-span-2">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500">Chọn vị trí trên bản đồ</span>
                <MapSelector
                  lat={location.coordinates.lat}
                  lng={location.coordinates.lng}
                  radius={location.radius}
                  onChangeLocation={location.handleMapLocationChange}
                />
              </div>
            </div>
          </section>
        )}

        <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-5">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Thông tin người tham dự</h2>
              <p className="mt-0.5 text-xs text-slate-500">Tùy chỉnh thông tin người quét QR cần nhập.</p>
            </div>
            <button
              type="button"
              onClick={customFields.addField}
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-slate-800"
            >
              <Plus className="h-3.5 w-3.5" />
              Thêm câu hỏi
            </button>
          </div>

          <div className="mt-4 divide-y divide-slate-100">
            {customFields.fields.map((field) => (
              <div key={field.id} className="flex flex-col justify-between gap-3 py-3 sm:flex-row sm:items-center">
                <div className="flex flex-1 items-center gap-2">
                  <GripVertical className="h-4 w-4 shrink-0 text-slate-300" />
                  <input
                    type="text"
                    aria-label="Tên trường thông tin"
                    value={field.label}
                    disabled={field.fixed}
                    onChange={(event) => customFields.updateFieldLabel(field.id, event.target.value)}
                    className="w-full max-w-sm rounded-lg border border-transparent bg-transparent px-2.5 py-1.5 text-sm font-medium text-slate-800 outline-none transition-colors hover:border-slate-200 focus:border-blue-600 disabled:hover:border-transparent"
                  />
                  {field.fixed ? (
                    <span className="rounded-md border border-slate-200 bg-slate-100 px-2 py-1 font-mono text-xs text-slate-500">Văn bản</span>
                  ) : (
                    <select
                      aria-label="Loại trường thông tin"
                      value={field.type}
                      onChange={(event) => customFields.updateFieldType(field.id, event.target.value as 'text' | 'tel' | 'number')}
                      className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-700 outline-none focus:border-blue-600"
                    >
                      <option value="text">Văn bản</option>
                      <option value="tel">Số điện thoại</option>
                      <option value="number">Con số</option>
                    </select>
                  )}
                </div>

                <div className="flex items-center gap-4 pl-6 sm:pl-0">
                  <label className="flex cursor-pointer select-none items-center gap-2">
                    <input
                      type="checkbox"
                      checked={field.required}
                      disabled={field.fixed}
                      onChange={(event) => customFields.updateFieldRequired(field.id, event.target.checked)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-600/20"
                    />
                    <span className="text-xs text-slate-600">Bắt buộc</span>
                  </label>
                  {!field.fixed && (
                    <button
                      type="button"
                      onClick={() => customFields.removeField(field.id)}
                      aria-label="Xóa câu hỏi"
                      className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
