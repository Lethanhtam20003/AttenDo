'use client';

import { useCallback } from 'react';
import { getLocationConsentStorageKey } from '@/constants/check-in';
import { detectCheckInEnvironment } from '@/lib/check-in/browser';
import type { CheckInEvent } from '@/types/database';
import { useCheckInStore } from '@/stores/check-in-store';

const LOCATION_TIMEOUT_MS = 8000;
const MAX_LOCATION_RETRIES = 2;
const IN_APP_FAST_DENIAL_MS = 1000;

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
export function useCheckInLocation(event: CheckInEvent | null) {
  const eventId = event?.id;
  const activeEventId = useCheckInStore((state) => state.eventId);
  const gpsReady = useCheckInStore((state) => state.gpsReady);
  const coords = useCheckInStore((state) => state.coords);
  const gpsError = useCheckInStore((state) => state.gpsError);
  const gpsIssue = useCheckInStore((state) => state.gpsIssue);
  const isRequestingLocation = useCheckInStore((state) => state.isRequestingLocation);
  const setGpsState = useCheckInStore((state) => state.setGpsState);

  const requestLocation = useCallback(() => {
    if (!eventId) return;
    const state = useCheckInStore.getState();
    if (state.eventId === eventId && state.isRequestingLocation) return;

    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      setGpsState(eventId, {
        isRequestingLocation: false,
        gpsIssue: 'unsupported',
        gpsError: 'Trình duyệt của bạn không hỗ trợ định vị GPS.',
      });
      return;
    }

    setGpsState(eventId, {
      gpsError: null,
      gpsIssue: null,
      isRequestingLocation: true,
      gpsReady: false,
      coords: null,
    });

    const requestStartedAt = Date.now();
    const environment = detectCheckInEnvironment(
      navigator.userAgent,
      navigator.maxTouchPoints
    );

    const acceptPosition = (position: GeolocationPosition) => {
      try {
        localStorage.setItem(getLocationConsentStorageKey(eventId), 'true');
      } catch {
        // Vẫn xác minh được vị trí nếu trình duyệt chặn bộ nhớ cục bộ.
      }

      setGpsState(eventId, {
        coords: {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        },
        gpsReady: true,
        gpsError: null,
        gpsIssue: null,
        isRequestingLocation: false,
      });
    };

    const reportLocationError = (error: GeolocationPositionError) => {
      const deniedQuickly =
        error.code === error.PERMISSION_DENIED &&
        Date.now() - requestStartedAt < IN_APP_FAST_DENIAL_MS;
      const issue =
        error.code === error.PERMISSION_DENIED &&
        (environment.inAppBrowser || deniedQuickly)
          ? 'in-app-browser'
          : error.code === error.PERMISSION_DENIED
            ? 'permission-denied'
            : error.code === error.TIMEOUT
              ? 'timeout'
              : 'position-unavailable';

      setGpsState(eventId, {
        gpsReady: false,
        isRequestingLocation: false,
        gpsIssue: issue,
        gpsError: issue === 'in-app-browser'
          ? 'Trình duyệt nhúng có thể đang chặn GPS. Hãy mở liên kết bằng Safari hoặc Chrome rồi thử lại.'
          : issue === 'permission-denied'
          ? 'Quyền vị trí của trình duyệt đang bị từ chối. Hãy bật quyền trong cài đặt rồi thử lại.'
          : issue === 'timeout'
            ? 'Chưa nhận được vị trí sau vài lần thử. Hãy bật Dịch vụ định vị của thiết bị rồi nhấn thử lại.'
            : 'Trình duyệt đã có quyền nhưng thiết bị chưa cung cấp vị trí. Hãy bật Dịch vụ định vị rồi nhấn thử lại.',
      });
    };

    const reportUnexpectedError = () => {
      setGpsState(eventId, {
        gpsReady: false,
        isRequestingLocation: false,
        gpsIssue: 'request-error',
        gpsError: 'Không thể yêu cầu vị trí từ trình duyệt. Hãy kiểm tra quyền vị trí rồi thử lại.',
      });
    };

    let retryCount = 0;
    const retryOrReport = (error: GeolocationPositionError) => {
      if (
        error.code === error.PERMISSION_DENIED ||
        error.code === error.POSITION_UNAVAILABLE
      ) {
        reportLocationError(error);
        return;
      }

      if (retryCount >= MAX_LOCATION_RETRIES) {
        reportLocationError(error);
        return;
      }

      retryCount += 1;
      setGpsState(eventId, { isRequestingLocation: true });
      window.setTimeout(requestPosition, 500);
    };

    function requestPosition() {
      try {
        navigator.geolocation.getCurrentPosition(
          acceptPosition,
          retryOrReport,
          { enableHighAccuracy: true, timeout: LOCATION_TIMEOUT_MS, maximumAge: 0 }
        );
      } catch {
        reportUnexpectedError();
      }
    }

    requestPosition();
  }, [eventId, setGpsState]);

  // Khoảng cách chỉ có thể tính khi đã có đủ tọa độ người dùng và sự kiện.
  const currentCoords = activeEventId === eventId ? coords : null;
  const currentGpsReady = activeEventId === eventId && gpsReady;
  const currentDistance =
    currentCoords && event?.location_lat != null && event?.location_lng != null
      ? calculateDistance(event.location_lat, event.location_lng, currentCoords.lat, currentCoords.lng)
      : null;
  const currentAccuracy = currentCoords ? currentCoords.accuracy : null;

  const isWithinRadius =
    currentDistance === null || (event ? currentDistance <= (event.radius_meters || 100) : true);

  return {
    gpsReady: currentGpsReady,
    coords: currentCoords,
    gpsError: activeEventId === eventId ? gpsError : null,
    gpsIssue: activeEventId === eventId ? gpsIssue : null,
    isRequestingLocation: activeEventId === eventId && isRequestingLocation,
    requestLocation,
    accuracy: currentAccuracy,
    currentDistance: currentDistance === null ? null : Math.ceil(currentDistance),
    isWithinRadius,
  };
}
