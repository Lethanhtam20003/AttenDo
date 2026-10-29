'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Navigation, Plus, Trash2, GripVertical, ArrowRight, ShieldCheck } from 'lucide-react';
import { useSessionStorageState } from '@/hooks/useSessionStorageState';

const EVENT_ID = 'evt-88219';
const EVENT_NAME_STORAGE_KEY = `host-event-name:${EVENT_ID}`;
const DEFAULT_EVENT_NAME = 'Hội thảo Trực quan Hóa Dữ liệu 2026';

const MapSelector = dynamic(() => import('@/components/host/MapSelector'), {
  ssr: false,
  loading: () => <div className="h-[280px] w-full bg-slate-100 animate-pulse rounded-xl" />,
});

interface CustomField {
  id: string;
  label: string;
  type: string;
  required: boolean;
  fixed: boolean;
}

export default function HostSetupPage() {
  const [eventName, setEventName] = useSessionStorageState(EVENT_NAME_STORAGE_KEY, DEFAULT_EVENT_NAME);
  const [coords, setCoords] = useState({ lat: 10.7769, lng: 106.7009 });
  const [radius, setRadius] = useState(100);
  const [isLocating, setIsLocating] = useState(false);

  const [fields, setFields] = useState<CustomField[]>([
    { id: '1', label: 'Họ và tên', type: 'Văn bản', required: true, fixed: true },
    { id: '2', label: 'Số điện thoại', type: 'Số', required: true, fixed: false },
    { id: '3', label: 'Đơn vị công tác', type: 'Văn bản', required: false, fixed: false },
  ]);

  const handleGetCurrentLocation = () => {
    setIsLocating(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setIsLocating(false);
        },
        () => setIsLocating(false),
        { enableHighAccuracy: true }
      );
    }
  };

  const addField = () => {
    const newField: CustomField = {
      id: Date.now().toString(),
      label: 'Câu hỏi mới',
      type: 'Văn bản',
      required: false,
      fixed: false,
    };
    setFields([...fields, newField]);
  };

  const removeField = (id: string) => {
    setFields(fields.filter((f) => f.id !== id));
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6">
      {/* Header Container */}
      <div className="max-w-4xl mx-auto mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Cấu hình phiên điểm danh</h1>
          <p className="text-sm text-slate-500 mt-1">Thiết lập Geofencing và thông tin người tham gia trước khi phát sóng.</p>
        </div>
        <Link
          href={`/host/live/${EVENT_ID}`}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-sm transition-colors"
        >
          Khởi chạy màn hình
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
        <section className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
          <label htmlFor="event-name" className="block text-sm font-semibold text-slate-900">
            Tên sự kiện
          </label>
          <input
            id="event-name"
            type="text"
            value={eventName}
            onChange={(event) => setEventName(event.target.value)}
            placeholder="Nhập tên sự kiện"
            className="mt-2 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-colors focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
          />
        </section>

        {/* Phần 1: Thiết lập vị trí */}
        <section className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
          <div className="flex items-center justify-between pb-5 border-b border-slate-100">
            <div>
              <h2 className="text-base font-semibold text-slate-900">1. Vị trí & Bán kính điểm danh</h2>
              <p className="text-xs text-slate-500 mt-0.5">Xác định ranh giới định vị bắt buộc khi check-in.</p>
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
                  onClick={handleGetCurrentLocation}
                  disabled={isLocating}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-blue-600 text-blue-600 hover:bg-blue-50 font-medium text-xs transition-colors shadow-sm disabled:opacity-50"
                >
                  <Navigation className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
                  {isLocating ? 'Đang dò GPS...' : 'Lấy vị trí hiện tại của tôi'}
                </button>
              </div>

              <div className="pt-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">Bán kính hợp lệ</span>
                <div className="grid grid-cols-3 gap-2">
                  {[50, 100, 200].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRadius(r)}
                      className={`py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                        radius === r
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
                <div>Lat: <span className="text-slate-900 font-semibold">{coords.lat.toFixed(5)}</span></div>
                <div>Lng: <span className="text-slate-900 font-semibold">{coords.lng.toFixed(5)}</span></div>
              </div>
            </div>

            <div className="md:col-span-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">Cách 2: Ghim trên bản đồ</span>
              <MapSelector 
                lat={coords.lat} 
                lng={coords.lng} 
                radius={radius} 
                onChangeLocation={(lat, lng) => setCoords({ lat, lng })}
              />
            </div>
          </div>
        </section>

        {/* Phần 2: Cấu hình Form tùy chỉnh */}
        <section className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
          <div className="flex items-center justify-between pb-5 border-b border-slate-100">
            <div>
              <h2 className="text-base font-semibold text-slate-900">2. Thu thập dữ liệu người tham dự</h2>
              <p className="text-xs text-slate-500 mt-0.5">Thêm/bớt câu hỏi trên Form quét QR.</p>
            </div>
            <button
              type="button"
              onClick={addField}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-sm transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Thêm câu hỏi
            </button>
          </div>

          <div className="mt-4 divide-y divide-slate-100">
            {fields.map((field) => (
              <div key={field.id} className="py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1">
                  <GripVertical className="w-4 h-4 text-slate-300 cursor-grab" />
                  <input
                    type="text"
                    defaultValue={field.label}
                    disabled={field.fixed}
                    className="text-sm font-medium text-slate-800 bg-transparent border border-transparent hover:border-slate-200 focus:border-blue-600 rounded-lg px-2.5 py-1.5 w-full max-w-sm outline-none transition-colors disabled:hover:border-transparent"
                  />
                  <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 border border-slate-200/70 font-mono">
                    {field.type}
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      defaultChecked={field.required}
                      disabled={field.fixed}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-600/20"
                    />
                    <span className="text-xs text-slate-600">Bắt buộc</span>
                  </label>
                  {!field.fixed && (
                    <button
                      type="button"
                      onClick={() => removeField(field.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
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