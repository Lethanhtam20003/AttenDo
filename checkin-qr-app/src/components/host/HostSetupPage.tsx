'use client';

import dynamic from 'next/dynamic';
import { useEffect } from 'react';
import { ArrowRight, GripVertical, Loader2, MapPin, Navigation, Plus, QrCode, ScanFace, ShieldCheck, Trash2 } from 'lucide-react';
import {
  PIN_REFRESH_DEFAULT_SECONDS,
  QR_TOKEN_LIFETIME_SECONDS,
} from '@/constants/check-in';
import { useCustomFields } from '@/hooks/host-setup/useCustomFields';
import { useHostSetupForm } from '@/hooks/host-setup/useHostSetupForm';
import { useHostSetupLocation } from '@/hooks/host-setup/useHostSetupLocation';
import { useHostSetupStore } from '@/stores/host-setup-store';

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
  const refreshInterval = useHostSetupStore((state) => state.refreshInterval);
  const setRefreshInterval = useHostSetupStore((state) => state.setRefreshInterval);
  const sessionDurationValue = useHostSetupStore((state) => state.sessionDurationValue);
  const setSessionDurationValue = useHostSetupStore((state) => state.setSessionDurationValue);
  const sessionDurationUnit = useHostSetupStore((state) => state.sessionDurationUnit);
  const setSessionDurationUnit = useHostSetupStore((state) => state.setSessionDurationUnit);
  const draggedFieldId = useHostSetupStore((state) => state.draggedFieldId);
  const setDraggedFieldId = useHostSetupStore((state) => state.setDraggedFieldId);
  const dropIndicator = useHostSetupStore((state) => state.dropIndicator);
  const setDropIndicator = useHostSetupStore((state) => state.setDropIndicator);
  const reset = useHostSetupStore((state) => state.reset);
  useEffect(() => {
    reset(String(defaultInterval));
  }, [defaultInterval, module, reset]);
  const location = useHostSetupLocation();
  const customFields = useCustomFields();
  const settings = {
    requireLocation: module === 'gps',
    requirePin: module === 'qr-pin',
    dynamicQr: module === 'dynamic-qr',
    dynamicQrIntervalSeconds: Number(refreshInterval),
    pinIntervalSeconds: Number(refreshInterval),
    sessionDurationMinutes: Math.round(
      Number(sessionDurationValue) * (sessionDurationUnit === 'hours' ? 60 : 1)
    ),
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
      <div className="mx-auto mb-8 max-w-4xl">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-blue-700">
            {module === 'gps' ? <MapPin className="h-4 w-4" /> : module === 'dynamic-qr' ? <QrCode className="h-4 w-4" /> : <ScanFace className="h-4 w-4" />}
            Cấu hình giải pháp
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{details.title}</h1>
          <p className="mt-1 text-sm text-slate-500">{details.description}</p>
        </div>
      </div>

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
            onBlur={form.checkTitleAvailability}
            aria-invalid={form.titleAvailability === 'taken' || form.titleAvailability === 'error'}
            aria-describedby="event-name-status"
            placeholder="Ví dụ: Hội thảo Chuyển đổi số 2026, Điểm danh Lớp CNTT K15..."
            className="mt-2 min-h-12 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-base text-slate-900 outline-none transition-colors focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 sm:min-h-11 sm:text-sm"
          />
          {form.titleAvailability !== 'idle' && (
            <p
              id="event-name-status"
              aria-live="polite"
              className={`mt-2 text-sm ${
                form.titleAvailability === 'taken' || form.titleAvailability === 'error'
                  ? 'text-rose-600'
                  : form.titleAvailability === 'available'
                    ? 'text-emerald-700'
                    : 'text-slate-500'
              }`}
            >
              {form.titleAvailability === 'checking' && 'Đang kiểm tra tên phiên...'}
              {form.titleAvailability === 'available' && 'Tên phiên có thể sử dụng.'}
              {form.titleAvailability === 'taken' &&
                'Tên phiên này đã được sử dụng. Vui lòng chọn tên khác.'}
              {form.titleAvailability === 'error' && form.titleAvailabilityError}
            </p>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <label htmlFor="event-starts-at" className="block text-sm font-semibold text-slate-900">
            Ngày và giờ bắt đầu điểm danh <span className="text-rose-500">*</span>
          </label>
          <input
            id="event-starts-at"
            type="datetime-local"
            required
            value={form.startsAt}
            onChange={(event) => form.setStartsAt(event.target.value)}
            className="mt-2 min-h-12 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-base text-slate-900 outline-none transition-colors focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 sm:min-h-11 sm:text-sm"
          />
          <p className="mt-2 text-xs text-slate-500">
            Chỉ cho phép check-in từ thời điểm này. Giờ được tính theo múi giờ Việt Nam (UTC+7).
          </p>
        </section>

        <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">Thời gian tồn tại phiên điểm danh</h2>
          <p className="mt-1 text-xs text-slate-500">
            Phiên sẽ tự động kết thúc khi hết thời gian đã chọn.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:max-w-xl sm:grid-cols-3">
            {[
              { label: '5 phút', minutes: 5 },
              { label: '15 phút', minutes: 15 },
              { label: '30 phút', minutes: 30 },
              { label: '1 giờ', minutes: 60 },
              { label: '2 giờ', minutes: 120 },
              { label: '4 giờ', minutes: 240 },
            ].map((option) => (
              <button
                key={option.minutes}
                type="button"
                onClick={() => {
                  if (option.minutes < 60) {
                    setSessionDurationUnit('minutes');
                    setSessionDurationValue(String(option.minutes));
                  } else {
                    setSessionDurationUnit('hours');
                    setSessionDurationValue(String(option.minutes / 60));
                  }
                }}
                aria-pressed={
                  Math.round(
                    Number(sessionDurationValue) *
                      (sessionDurationUnit === 'hours' ? 60 : 1)
                  ) === option.minutes
                }
                className={`min-h-11 rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${
                  Math.round(
                    Number(sessionDurationValue) *
                      (sessionDurationUnit === 'hours' ? 60 : 1)
                  ) === option.minutes
                    ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <div className="mt-4 max-w-lg">
            <label htmlFor="session-duration" className="block text-sm font-medium text-slate-700">
              Hoặc nhập thời lượng
            </label>
            <div className="mt-2 flex items-center gap-2">
              <input
                id="session-duration"
                type="number"
                min={sessionDurationUnit === 'hours' ? 1 / 60 : 1}
                max={sessionDurationUnit === 'hours' ? 168 : 10080}
                step={sessionDurationUnit === 'hours' ? 0.01 : 1}
                value={sessionDurationValue}
                onChange={(event) => setSessionDurationValue(event.target.value)}
                className="min-h-11 w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-900 outline-none transition-colors focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
              />
              <select
                aria-label="Đơn vị thời lượng phiên"
                value={sessionDurationUnit}
                onChange={(event) => {
                  const nextUnit = event.target.value as 'minutes' | 'hours';
                  const currentValue = Number(sessionDurationValue);
                  if (Number.isFinite(currentValue)) {
                    const convertedValue =
                      nextUnit === 'minutes' && sessionDurationUnit === 'hours'
                        ? String(Math.round(currentValue * 60))
                        : nextUnit === 'hours' && sessionDurationUnit === 'minutes'
                          ? (currentValue / 60).toFixed(2).replace(/\.?0+$/, '')
                          : sessionDurationValue;
                    setSessionDurationValue(convertedValue);
                  }
                  setSessionDurationUnit(nextUnit);
                }}
                className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-600"
              >
                <option value="minutes">Phút</option>
                <option value="hours">Giờ</option>
              </select>
            </div>
            <p className="mt-1.5 text-xs text-slate-500">
              Từ 1 phút đến 168 giờ (tối đa 7 ngày). Mặc định: 2 giờ.
            </p>
          </div>
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
            {customFields.fields.length === 0 && (
              <p className="py-5 text-center text-sm text-slate-500">
                Chưa có trường thông tin. Hãy thêm ít nhất một câu hỏi để tạo phiên điểm danh.
              </p>
            )}
            {customFields.fields.map((field) => (
              <div
                key={field.id}
                data-custom-field-row
                onDragOver={(event) => {
                  event.preventDefault();
                  if (draggedFieldId === field.id) {
                    setDropIndicator(null);
                    return;
                  }
                  const bounds = event.currentTarget.getBoundingClientRect();
                  setDropIndicator({
                    fieldId: field.id,
                    placeAfter: event.clientY > bounds.top + bounds.height / 2,
                  });
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  if (draggedFieldId && draggedFieldId !== field.id) {
                    const bounds = event.currentTarget.getBoundingClientRect();
                    customFields.reorderField(
                      draggedFieldId,
                      field.id,
                      event.clientY > bounds.top + bounds.height / 2
                    );
                  }
                  setDropIndicator(null);
                  setDraggedFieldId(null);
                }}
                className={`relative flex flex-col justify-between gap-3 py-3 sm:flex-row sm:items-center ${
                  draggedFieldId === field.id ? 'opacity-50' : ''
                }`}
              >
                {dropIndicator?.fieldId === field.id && draggedFieldId !== field.id && (
                  <div
                    aria-hidden="true"
                    className={`pointer-events-none absolute inset-x-0 z-10 flex items-center ${
                      dropIndicator.placeAfter ? 'bottom-0 translate-y-1/2' : 'top-0 -translate-y-1/2'
                    }`}
                  >
                    <span className="h-2 w-2 rounded-full bg-blue-600" />
                    <span className="h-0.5 flex-1 bg-blue-600" />
                    <span className="h-2 w-2 rounded-full bg-blue-600" />
                  </div>
                )}
                <div className="flex flex-1 items-center gap-2">
                  <button
                    type="button"
                    draggable
                    aria-label={`Kéo để sắp xếp trường ${field.label}`}
                    onDragStart={(event) => {
                      setDraggedFieldId(field.id);
                      event.dataTransfer.effectAllowed = 'move';
                      event.dataTransfer.setData('text/plain', field.id);
                      const row = event.currentTarget.closest<HTMLElement>('[data-custom-field-row]');
                      if (row) {
                        const preview = row.cloneNode(true) as HTMLElement;
                        const bounds = row.getBoundingClientRect();
                        preview.style.position = 'absolute';
                        preview.style.top = '-1000px';
                        preview.style.width = `${bounds.width}px`;
                        preview.style.padding = '12px 16px';
                        preview.style.border = '1px solid #e2e8f0';
                        preview.style.borderRadius = '12px';
                        preview.style.backgroundColor = '#fff';
                        preview.style.boxShadow = '0 8px 20px rgb(15 23 42 / 15%)';
                        preview.style.opacity = '0.95';
                        document.body.appendChild(preview);
                        event.dataTransfer.setDragImage(
                          preview,
                          event.clientX - bounds.left,
                          event.clientY - bounds.top
                        );
                        window.setTimeout(() => preview.remove(), 0);
                      }
                    }}
                    onDragEnd={() => {
                      setDraggedFieldId(null);
                      setDropIndicator(null);
                    }}
                    className="shrink-0 cursor-grab text-slate-300 active:cursor-grabbing"
                  >
                    <GripVertical className="h-4 w-4" />
                  </button>
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
                      onChange={(event) => customFields.updateFieldRequired(field.id, event.target.checked)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-600/20"
                    />
                    <span className="text-xs text-slate-600">Bắt buộc</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => customFields.removeField(field.id)}
                    aria-label="Xóa câu hỏi"
                    className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="mx-auto mt-6 max-w-4xl">
        {form.errorMsg && (
          <div role="alert" className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
            {form.errorMsg}
          </div>
        )}
        <button
          type="button"
          onClick={form.handleLaunch}
          disabled={form.isPending}
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:opacity-60 sm:w-auto sm:min-h-11"
        >
          {form.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
          {form.isPending ? 'Đang khởi tạo...' : 'Bắt Đầu Điểm Danh'}
        </button>
      </div>
    </main>
  );
}
