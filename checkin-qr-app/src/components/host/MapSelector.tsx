'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Info } from 'lucide-react';

interface MapSelectorProps {
  lat: number;
  lng: number;
  radius: number;
  onChangeLocation: (lat: number, lng: number) => void;
}

export default function MapSelector({ lat, lng, radius, onChangeLocation }: MapSelectorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const circleRef = useRef<L.Circle | null>(null);
  const onChangeLocationRef = useRef(onChangeLocation);

  useEffect(() => {
    onChangeLocationRef.current = onChangeLocation;
  });

  useEffect(() => {
  if (!containerRef.current || mapRef.current) return;

  const icon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

  const map = L.map(containerRef.current).setView([lat, lng], 16);
  mapRef.current = map;

  // Dùng Google Satellite Hybrid
  L.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
    maxZoom: 20,
    attribution: '&copy; Google Maps',
  }).addTo(map);

  const marker = L.marker([lat, lng], { draggable: true, icon }).addTo(map);
  markerRef.current = marker;

  const circle = L.circle([lat, lng], {
    radius,
    color: '#2563eb',
    fillColor: '#3b82f6',
    fillOpacity: 0.25,
    weight: 2,
  }).addTo(map);
  circleRef.current = circle;

  marker.on('dragend', () => {
    const pos = marker.getLatLng();
    circle.setLatLng(pos);
    onChangeLocationRef.current(pos.lat, pos.lng);
  });

  map.on('click', (e) => {
    marker.setLatLng(e.latlng);
    circle.setLatLng(e.latlng);
    onChangeLocationRef.current(e.latlng.lat, e.latlng.lng);
  });

  return () => {
    map.remove();
    mapRef.current = null;
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);
  // Cập nhật vị trí và bán kính khi state thay đổi
  useEffect(() => {
    if (!mapRef.current || !markerRef.current || !circleRef.current) return;
    const currentPos = markerRef.current.getLatLng();
    if (Math.abs(currentPos.lat - lat) > 0.00001 || Math.abs(currentPos.lng - lng) > 0.00001) {
      markerRef.current.setLatLng([lat, lng]);
      circleRef.current.setLatLng([lat, lng]);
      mapRef.current.panTo([lat, lng]);
    }
    circleRef.current.setRadius(radius);
  }, [lat, lng, radius]);

  return (
    <div className="relative w-full h-[280px] rounded-xl border border-slate-200 overflow-hidden shadow-inner">
      <div ref={containerRef} className="w-full h-full z-0" />
      <div className="absolute bottom-2 left-2 z-[400] bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-200/80 text-[11px] text-slate-700 shadow-sm flex items-center gap-1.5 pointer-events-none">
        <Info className="w-3.5 h-3.5 text-blue-600 shrink-0" />
        Kéo ghim hoặc click trên bản đồ để đặt tâm điểm danh
      </div>
    </div>
  );
}
