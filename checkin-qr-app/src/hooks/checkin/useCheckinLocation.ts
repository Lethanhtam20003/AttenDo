'use client';

import { useCallback, useEffect, useState } from 'react';
import type { Event } from '@/types/database';

interface Coordinates {
  lat: number;
  lng: number;
}

// Tính khoảng cách giữa hai tọa độ GPS theo mét bằng công thức Haversine.
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const earthRadius = 6371000;
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const latitudeDelta = toRadians(lat2 - lat1);
  const longitudeDelta = toRadians(lng2 - lng1);
  const a =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(longitudeDelta / 2) ** 2;
  return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Xin quyền GPS, tính khoảng cách đến sự kiện và kiểm tra giới hạn geofence.
export function useCheckinLocation(event: Event | null, pauseAutoRequest = false) {
  const [gpsReady, setGpsReady] = useState(false);
  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [isRefiningLocation, setIsRefiningLocation] = useState(false);
  const [isPermissionDenied, setIsPermissionDenied] = useState(false);

  const requestLocation = useCallback(() => {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      setGpsError('Trình duyệt của bạn không hỗ trợ định vị GPS.');
      return;
    }

    setGpsError(null);
    setIsPermissionDenied(false);
    setGpsReady(false);
    setCoords(null);
    setIsRefiningLocation(false);

    const acceptPosition = (position: GeolocationPosition) => {
      setCoords({ lat: position.coords.latitude, lng: position.coords.longitude });
      setGpsReady(true);
      setIsRefiningLocation(false);
    };

    const reportLocationError = (error: GeolocationPositionError) => {
      setGpsReady(false);
      setIsRefiningLocation(false);
      setIsPermissionDenied(error.code === error.PERMISSION_DENIED);
      setGpsError(
        error.code === error.PERMISSION_DENIED
          ? 'Chưa được cấp quyền truy cập vị trí.'
          : 'Không lấy được vị trí. Hãy bật Dịch vụ định vị và thử lại.'
      );
    };

    const requestPreciseLocation = () => {
      setIsRefiningLocation(true);
      navigator.geolocation.getCurrentPosition(
        acceptPosition,
        reportLocationError,
        { enableHighAccuracy: true, timeout: 7000, maximumAge: 30000 }
      );
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const eventLatitude = event?.location_lat;
        const eventLongitude = event?.location_lng;
        const accuracy = position.coords.accuracy;
        const distance = eventLatitude != null && eventLongitude != null
          ? calculateDistance(
              eventLatitude,
              eventLongitude,
              position.coords.latitude,
              position.coords.longitude
            )
          : null;
        const radius = event?.radius_meters || 100;
        const safelyClassified =
          distance !== null &&
          (distance + accuracy <= radius || distance - accuracy > radius);

        if (safelyClassified) {
          acceptPosition(position);
          return;
        }

        requestPreciseLocation();
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          reportLocationError(error);
          return;
        }

        requestPreciseLocation();
      },
      { enableHighAccuracy: false, timeout: 2500, maximumAge: 30000 }
    );
  }, [event]);

  useEffect(() => {
    if (!event || pauseAutoRequest) return;

    if (event.module_settings?.require_location === false) {
      const timer = setTimeout(() => {
        setGpsReady(true);
        setCoords(null);
        setGpsError(null);
      }, 0);
      return () => clearTimeout(timer);
    }

    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      const timer = setTimeout(() => {
        setGpsError('Trình duyệt của bạn không hỗ trợ định vị GPS.');
      }, 0);
      return () => clearTimeout(timer);
    }

    // Tự lấy vị trí khi mở trang; setTimeout để tránh cập nhật state đồng bộ trong effect.
    const timer = setTimeout(requestLocation, 0);
    return () => clearTimeout(timer);
  }, [event, pauseAutoRequest, requestLocation]);

  // Khoảng cách chỉ có thể tính khi đã có đủ tọa độ người dùng và sự kiện.
  const currentDistance =
    coords && event?.location_lat != null && event?.location_lng != null
      ? Math.round(calculateDistance(event.location_lat, event.location_lng, coords.lat, coords.lng))
      : null;

  const isWithinRadius =
    currentDistance === null || (event ? currentDistance <= (event.radius_meters || 100) : true);

  return {
    gpsReady,
    coords,
    gpsError,
    isRefiningLocation,
    isPermissionDenied,
    requestLocation,
    currentDistance,
    isWithinRadius,
  };
}
