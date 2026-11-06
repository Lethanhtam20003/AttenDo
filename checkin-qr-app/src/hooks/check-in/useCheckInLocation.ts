'use client';

import { useCallback, useEffect } from 'react';
import { getLocationConsentStorageKey } from '@/constants/check-in';
import type { CheckInEvent } from '@/types/database';
import { useCheckInStore } from '@/stores/check-in-store';

const LOCATION_TIMEOUT_MS = 8000;
const MAX_LOCATION_RETRIES = 2;

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
export function useCheckInLocation(event: CheckInEvent | null, pauseAutoRequest = false) {
  const eventId = event?.id;
  const activeEventId = useCheckInStore((state) => state.eventId);
  const gpsReady = useCheckInStore((state) => state.gpsReady);
  const coords = useCheckInStore((state) => state.coords);
  const gpsError = useCheckInStore((state) => state.gpsError);
  const gpsIssue = useCheckInStore((state) => state.gpsIssue);
  const isRequestingLocation = useCheckInStore((state) => state.isRequestingLocation);
  const isRefiningLocation = useCheckInStore((state) => state.isRefiningLocation);
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
      isRefiningLocation: false,
    });

    const acceptPosition = (position: GeolocationPosition) => {
      try {
        localStorage.setItem(getLocationConsentStorageKey(eventId), 'true');
      } catch {
        // Vẫn xác minh được vị trí nếu trình duyệt chặn bộ nhớ cục bộ.
      }

      setGpsState(eventId, {
        coords: { lat: position.coords.latitude, lng: position.coords.longitude },
        gpsReady: true,
        gpsError: null,
        gpsIssue: null,
        isRequestingLocation: false,
        isRefiningLocation: false,
      });
    };

    const reportLocationError = (error: GeolocationPositionError) => {
      const issue = error.code === error.PERMISSION_DENIED
        ? 'permission-denied'
        : error.code === error.TIMEOUT
          ? 'timeout'
          : 'position-unavailable';

      setGpsState(eventId, {
        gpsReady: false,
        isRequestingLocation: false,
        isRefiningLocation: false,
        gpsIssue: issue,
        gpsError: issue === 'permission-denied'
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
        isRefiningLocation: false,
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
      setGpsState(eventId, { isRequestingLocation: true, isRefiningLocation: false });
      window.setTimeout(requestPosition, 500);
    };

    const requestPrecisePosition = () => {
      setGpsState(eventId, { isRefiningLocation: true });
      try {
        navigator.geolocation.getCurrentPosition(
          acceptPosition,
          retryOrReport,
          { enableHighAccuracy: true, timeout: LOCATION_TIMEOUT_MS, maximumAge: 30000 }
        );
      } catch {
        reportUnexpectedError();
      }
    };

    function requestPosition() {
      try {
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

            requestPrecisePosition();
          },
          retryOrReport,
          { enableHighAccuracy: false, timeout: LOCATION_TIMEOUT_MS, maximumAge: 30000 }
        );
      } catch {
        reportUnexpectedError();
      }
    }

    requestPosition();
  }, [event, eventId, setGpsState]);

  useEffect(() => {
    if (!event || pauseAutoRequest) return;

    if (event.module_settings?.require_location === false) {
      const timer = setTimeout(() => {
        setGpsState(event.id, { gpsReady: true, coords: null, gpsError: null, gpsIssue: null });
      }, 0);
      return () => clearTimeout(timer);
    }

    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      const timer = setTimeout(() => {
        setGpsState(event.id, {
          gpsError: 'Trình duyệt của bạn không hỗ trợ định vị GPS.',
          gpsIssue: 'unsupported',
        });
      }, 0);
      return () => clearTimeout(timer);
    }

    // Tự lấy vị trí khi mở trang; setTimeout để tránh cập nhật state đồng bộ trong effect.
    const timer = setTimeout(requestLocation, 0);
    return () => clearTimeout(timer);
  }, [event, eventId, pauseAutoRequest, requestLocation, setGpsState]);

  // Khoảng cách chỉ có thể tính khi đã có đủ tọa độ người dùng và sự kiện.
  const currentCoords = activeEventId === eventId ? coords : null;
  const currentGpsReady = activeEventId === eventId && gpsReady;
  const currentDistance =
    currentCoords && event?.location_lat != null && event?.location_lng != null
      ? calculateDistance(event.location_lat, event.location_lng, currentCoords.lat, currentCoords.lng)
      : null;

  const isWithinRadius =
    currentDistance === null || (event ? currentDistance <= (event.radius_meters || 100) : true);

  return {
    gpsReady: currentGpsReady,
    coords: currentCoords,
    gpsError: activeEventId === eventId ? gpsError : null,
    gpsIssue: activeEventId === eventId ? gpsIssue : null,
    isRequestingLocation: activeEventId === eventId && isRequestingLocation,
    isRefiningLocation: activeEventId === eventId && isRefiningLocation,
    requestLocation,
    currentDistance: currentDistance === null ? null : Math.ceil(currentDistance),
    isWithinRadius,
  };
}
