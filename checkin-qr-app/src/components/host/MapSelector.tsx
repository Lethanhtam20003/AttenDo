'use client';

import { MapPin, Info } from 'lucide-react';

interface MapSelectorProps {
  lat: number;
  lng: number;
  radius: number;
  onChangeLocation: (lat: number, lng: number) => void;
}

export default function MapSelector({ lat, lng, radius, onChangeLocation }: MapSelectorProps) {
  return (
    <div className="relative w-full h-[280px] rounded-xl border border-slate-200 overflow-hidden bg-slate-100 flex items-center justify-center select-none group">
      {/* Lưới giả lập Map View (có thể thay bằng <MapContainer> của react-leaflet) */}
      <div 
        className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1.2px,transparent_1.2px)] [background-size:16px_16px] opacity-80"
        onClick={(e) => {
          // Mock click ghim vị trí mới
          const rect = e.currentTarget.getBoundingClientRect();
          const offsetX = (e.clientX - rect.left - rect.width / 2) / 10000;
          const offsetY = (e.clientY - rect.top - rect.height / 2) / 10000;
          onChangeLocation(lat - offsetY, lng + offsetX);
        }}
      />

      {/* Vòng tròn bán kính Geofence */}
      <div 
        className="relative flex items-center justify-center transition-all duration-300"
        style={{ transform: `scale(${radius / 100})` }}
      >
        <div className="w-36 h-36 rounded-full bg-blue-600/15 border-2 border-blue-600/40 animate-pulse pointer-events-none" />
      </div>

      {/* Ghim trung tâm */}
      <div className="absolute pointer-events-none flex flex-col items-center">
        <MapPin className="w-8 h-8 text-blue-600 drop-shadow-md -translate-y-4" />
      </div>

      <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-200/80 text-xs text-slate-600 shadow-sm flex items-center gap-1.5">
        <Info className="w-3.5 h-3.5 text-blue-600" />
        Click lên bản đồ để thay đổi tâm ghim
      </div>
    </div>
  );
}
