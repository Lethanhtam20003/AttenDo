'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  CONVERGED_ACCURACY_THRESHOLD_METERS,
  FAST_DENY_THRESHOLD_MS,
  IOS_APPROXIMATE_LOCATION_THRESHOLD_METERS,
  buildAndroidChromeIntentUrl,
  detectBrowserEnvironment,
  evaluateGeofence,
} from '@/lib/check-in/geolocation';
import {
  useCheckInStore,
  type CheckInLocationSamplePayload,
} from '@/stores/check-in-store';
import type { CheckInEvent } from '@/types/database';

const TIER1_CONVERGENCE_MS = 6000;

interface UseCheckInLocationOptions {
  eventId?: string;
  event: CheckInEvent | null;
  enabled: boolean;
}

/**
 * Kiểm tra trạng thái quyền Geolocation của trang web để phân biệt trường hợp
 * đã cấp quyền cho trang web nhưng chưa bật công tắc GPS của điện thoại.
 */
async function queryBrowserGeolocationPermission(): Promise<PermissionState | 'unknown'> {
  if (typeof navigator === 'undefined' || !navigator.permissions?.query) {
    return 'unknown';
  }
  try {
    const status = await navigator.permissions.query({ name: 'geolocation' });
    return status.state;
  } catch {
    return 'unknown';
  }
}

/**
 * Điều phối định vị GPS 2 tầng (watchPosition hội tụ cao -> fallback Wi-Fi/Cell trong nhà)
 * và xử lý tương thích cho iOS Safari, Android Chrome, Zalo/Messenger WebView.
 */
export function useCheckInLocation({
  eventId,
  event,
  enabled,
}: UseCheckInLocationOptions) {
  const activeEventId = useCheckInStore((state) => state.eventId);
  const storedLocationStatus = useCheckInStore((state) => state.locationStatus);
  const storedLocationErrorCode = useCheckInStore((state) => state.locationErrorCode);
  const storedLocationErrorMessage = useCheckInStore((state) => state.locationErrorMessage);
  const storedUserLat = useCheckInStore((state) => state.userLat);
  const storedUserLng = useCheckInStore((state) => state.userLng);
  const storedUserAccuracy = useCheckInStore((state) => state.userAccuracy);
  const storedRawDistance = useCheckInStore((state) => state.rawDistance);
  const storedEffectiveDistance = useCheckInStore((state) => state.effectiveDistance);
  const storedIsWithinRadius = useCheckInStore((state) => state.isWithinRadius);
  const storedIsLinkCopied = useCheckInStore((state) => state.isLinkCopied);
  const storedIsModalDismissed = useCheckInStore((state) => state.isLocationModalDismissed);
  const setLocationRequesting = useCheckInStore((state) => state.setLocationRequesting);
  const setLocationSample = useCheckInStore((state) => state.setLocationSample);
  const setLocationError = useCheckInStore((state) => state.setLocationError);
  const setIsLinkCopied = useCheckInStore((state) => state.setIsLinkCopied);
  const setIsLocationModalDismissed = useCheckInStore(
    (state) => state.setIsLocationModalDismissed
  );

  const watchIdRef = useRef<number | null>(null);
  const convergenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bestSampleRef = useRef<CheckInLocationSamplePayload | null>(null);

  const isCurrentEvent = activeEventId === eventId;
  const locationStatus = isCurrentEvent ? storedLocationStatus : 'idle';
  const locationErrorCode = isCurrentEvent ? storedLocationErrorCode : null;
  const locationErrorMessage = isCurrentEvent ? storedLocationErrorMessage : null;
  const userLat = isCurrentEvent ? storedUserLat : null;
  const userLng = isCurrentEvent ? storedUserLng : null;
  const userAccuracy = isCurrentEvent ? storedUserAccuracy : null;
  const rawDistance = isCurrentEvent ? storedRawDistance : null;
  const effectiveDistance = isCurrentEvent ? storedEffectiveDistance : null;
  const isWithinRadius = isCurrentEvent && storedIsWithinRadius;
  const isLinkCopied = isCurrentEvent && storedIsLinkCopied;
  const isLocationModalDismissed = isCurrentEvent && storedIsModalDismissed;

  const environment = useMemo(() => detectBrowserEnvironment(), []);

  const clearHardwareWatch = useCallback(() => {
    if (convergenceTimerRef.current !== null) {
      clearTimeout(convergenceTimerRef.current);
      convergenceTimerRef.current = null;
    }
    if (watchIdRef.current !== null && typeof navigator !== 'undefined' && navigator.geolocation) {
      try {
        navigator.geolocation.clearWatch(watchIdRef.current);
      } catch {
        // Bỏ qua lỗi đóng watchId trên một số WebView đời cũ.
      }
      watchIdRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      clearHardwareWatch();
      if (copyTimerRef.current !== null) {
        clearTimeout(copyTimerRef.current);
      }
    };
  }, [clearHardwareWatch, eventId]);

  const buildSamplePayload = useCallback(
    (coords: GeolocationCoordinates, isConverged: boolean): CheckInLocationSamplePayload => {
      const accuracy = Math.max(1, Math.round(coords.accuracy || 0));
      const evaluation = evaluateGeofence({
        userLat: coords.latitude,
        userLng: coords.longitude,
        accuracy,
        targetLat: event?.location_lat ?? null,
        targetLng: event?.location_lng ?? null,
        radiusMeters: event?.radius_meters ?? 100,
      });

      return {
        userLat: coords.latitude,
        userLng: coords.longitude,
        userAccuracy: accuracy,
        rawDistance: evaluation.rawDistance,
        effectiveDistance: evaluation.effectiveDistance,
        isWithinRadius: evaluation.isWithinRadius,
        isConverged,
      };
    },
    [event?.location_lat, event?.location_lng, event?.radius_meters]
  );

  const handleRequestLocation = useCallback((): Promise<CheckInLocationSamplePayload | null> => {
    if (!eventId || !enabled) {
      return Promise.resolve(null);
    }

    clearHardwareWatch();
    bestSampleRef.current = null;

    if (typeof window === 'undefined' || !navigator.geolocation) {
      setLocationError(
        eventId,
        'unsupported',
        'Trình duyệt hoặc thiết bị của bạn không hỗ trợ định vị GPS.'
      );
      return Promise.resolve(null);
    }

    if (window.isSecureContext === false) {
      setLocationError(
        eventId,
        'insecure_context',
        'Trình duyệt chặn mở vị trí vì trang đang truy cập qua kết nối HTTP không bảo mật (cần HTTPS hoặc localhost).'
      );
      return Promise.resolve(null);
    }

    const requestStartedAt = Date.now();

    return new Promise<CheckInLocationSamplePayload | null>((resolve) => {
      let isSettled = false;

      const finishWithSample = (sample: CheckInLocationSamplePayload) => {
        if (isSettled) return;
        isSettled = true;
        clearHardwareWatch();
        const finalSample: CheckInLocationSamplePayload = {
          ...sample,
          isConverged: true,
        };
        setLocationSample(eventId, finalSample);
        resolve(finalSample);
      };

      const finishWithError = async (error: GeolocationPositionError) => {
        if (isSettled) return;
        isSettled = true;
        clearHardwareWatch();

        const elapsedMs = Date.now() - requestStartedAt;
        const rawMessage = (error.message || '').toLowerCase();

        if (rawMessage.includes('secure origin')) {
          setLocationError(
            eventId,
            'insecure_context',
            'Trình duyệt chỉ cho phép bật vị trí trên kết nối HTTPS hoặc localhost.'
          );
          resolve(null);
          return;
        }

        // Khi người dùng đã cho phép trang web ('granted') nhưng GPS của điện thoại chưa bật,
        // hàm lấy vị trí trả về lỗi nhưng phải thông báo là cần mở vị trí (GPS) trên điện thoại.
        const browserPermissionState = await queryBrowserGeolocationPermission();
        const isSystemLocationDisabledMessage =
          rawMessage.includes('location services') ||
          rawMessage.includes('disabled') ||
          rawMessage.includes('provider') ||
          rawMessage.includes('location unknown');

        if (
          error.code === error.POSITION_UNAVAILABLE ||
          browserPermissionState === 'granted' ||
          isSystemLocationDisabledMessage
        ) {
          setLocationError(
            eventId,
            'device_gps_off',
            'Vui lòng mở Vị trí (GPS) trên điện thoại của bạn để tiếp tục điểm danh.'
          );
          resolve(null);
          return;
        }

        if (error.code === error.PERMISSION_DENIED) {
          if (environment.isInAppBrowser && elapsedMs < FAST_DENY_THRESHOLD_MS) {
            setLocationError(
              eventId,
              'fast_denied_inapp',
              `Vui lòng mở Vị trí (GPS) trên điện thoại hoặc chuyển từ ${environment.browserName} sang ${environment.isIOS ? 'Safari' : 'Chrome'}.`
            );
          } else {
            setLocationError(
              eventId,
              'permission_denied',
              'Vui lòng mở Vị trí (GPS) trên điện thoại và cho phép trình duyệt truy cập vị trí.'
            );
          }
          resolve(null);
          return;
        }

        setLocationError(
          eventId,
          'timeout',
          'Không nhận được tín hiệu định vị. Vui lòng kiểm tra và mở Vị trí (GPS) trên điện thoại rồi thử lại.'
        );
        resolve(null);
      };

      // Tầng 2 (Indoor Fallback): Định vị qua Wi-Fi/Cell khi Tầng 1 bị TIMEOUT hoặc POSITION_UNAVAILABLE.
      const runTier2IndoorFallback = () => {
        try {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const fallbackSample = buildSamplePayload(position.coords, true);
              finishWithSample(fallbackSample);
            },
            (fallbackError) => {
              if (bestSampleRef.current) {
                finishWithSample(bestSampleRef.current);
                return;
              }
              void finishWithError(fallbackError);
            },
            {
              enableHighAccuracy: false,
              timeout: 5000,
              maximumAge: 30000,
            }
          );
        } catch {
          setLocationError(
            eventId,
            'device_gps_off',
            'Vui lòng mở Vị trí (GPS) trên điện thoại của bạn rồi thử lại.'
          );
          resolve(null);
        }
      };

      // Chốt mẫu tốt nhất sau 6 giây ở Tầng 1 hoặc chuyển sang Tầng 2.
      convergenceTimerRef.current = setTimeout(() => {
        if (isSettled) return;
        clearHardwareWatch();
        if (bestSampleRef.current) {
          finishWithSample(bestSampleRef.current);
          return;
        }
        runTier2IndoorFallback();
      }, TIER1_CONVERGENCE_MS);

      // Tầng 1: Gọi watchPosition đồng bộ ngay trong User Gesture để hội tụ tọa độ có accuracy <= 35m.
      try {
        watchIdRef.current = navigator.geolocation.watchPosition(
          (position) => {
            if (isSettled) return;
            const candidate = buildSamplePayload(position.coords, false);
            const currentBest = bestSampleRef.current;

            const shouldUpdateBest =
              !currentBest ||
              candidate.userAccuracy <= currentBest.userAccuracy ||
              (candidate.isWithinRadius && !currentBest.isWithinRadius);

            if (shouldUpdateBest) {
              bestSampleRef.current = candidate;
              setLocationSample(eventId, candidate);
            }

            if (
              candidate.isWithinRadius &&
              candidate.userAccuracy <= CONVERGED_ACCURACY_THRESHOLD_METERS
            ) {
              finishWithSample(candidate);
            }
          },
          async (watchError) => {
            if (isSettled) return;
            clearHardwareWatch();

            if (bestSampleRef.current) {
              finishWithSample(bestSampleRef.current);
              return;
            }

            if (watchError.code === watchError.PERMISSION_DENIED) {
              const permState = await queryBrowserGeolocationPermission();
              if (permState === 'granted') {
                runTier2IndoorFallback();
                return;
              }
              await finishWithError(watchError);
              return;
            }

            runTier2IndoorFallback();
          },
          {
            enableHighAccuracy: true,
            timeout: TIER1_CONVERGENCE_MS,
            maximumAge: 10000,
          }
        );

        setIsLocationModalDismissed(eventId, true);
        setLocationRequesting(eventId);
      } catch {
        setIsLocationModalDismissed(eventId, true);
        clearHardwareWatch();
        runTier2IndoorFallback();
      }
    });
  }, [
    buildSamplePayload,
    clearHardwareWatch,
    enabled,
    environment.browserName,
    environment.isIOS,
    environment.isInAppBrowser,
    eventId,
    setIsLocationModalDismissed,
    setLocationError,
    setLocationRequesting,
    setLocationSample,
  ]);

  // Tự động kiểm tra lại vị trí ngay khi người dùng bật GPS trên điện thoại và quay lại trang.
  useEffect(() => {
    if (
      !enabled ||
      !eventId ||
      locationStatus !== 'error' ||
      (locationErrorCode !== 'device_gps_off' &&
        locationErrorCode !== 'position_unavailable' &&
        locationErrorCode !== 'timeout' &&
        locationErrorCode !== 'permission_denied')
    ) {
      return;
    }

    const handleResumeAfterEnablingGps = () => {
      if (document.visibilityState === 'visible') {
        void handleRequestLocation();
      }
    };

    window.addEventListener('focus', handleResumeAfterEnablingGps);
    document.addEventListener('visibilitychange', handleResumeAfterEnablingGps);

    return () => {
      window.removeEventListener('focus', handleResumeAfterEnablingGps);
      document.removeEventListener('visibilitychange', handleResumeAfterEnablingGps);
    };
  }, [enabled, eventId, handleRequestLocation, locationErrorCode, locationStatus]);

  const handleOpenInAndroidChrome = useCallback(() => {
    if (typeof window === 'undefined') return;
    window.location.href = buildAndroidChromeIntentUrl(window.location.href);
  }, []);

  const handleDismissLocationModal = useCallback(() => {
    if (!eventId) return;
    setIsLocationModalDismissed(eventId, true);
  }, [eventId, setIsLocationModalDismissed]);

  const handleCopyCheckInLink = useCallback(async () => {
    if (!eventId || typeof window === 'undefined') return;
    try {
      await navigator.clipboard.writeText(window.location.href);
      setIsLinkCopied(eventId, true);
      if (copyTimerRef.current !== null) {
        clearTimeout(copyTimerRef.current);
      }
      copyTimerRef.current = setTimeout(() => {
        setIsLinkCopied(eventId, false);
      }, 2500);
    } catch {
      // Bỏ qua nếu WebView chặn Clipboard API.
    }
  }, [eventId, setIsLinkCopied]);

  const hasLowAccuracyOnIOS =
    environment.isIOS &&
    userAccuracy !== null &&
    userAccuracy >= IOS_APPROXIMATE_LOCATION_THRESHOLD_METERS &&
    !isWithinRadius;

  const isLocationModalOpen =
    enabled && locationStatus === 'idle' && !isLocationModalDismissed;

  return {
    locationStatus,
    locationErrorCode,
    locationErrorMessage,
    userLat,
    userLng,
    userAccuracy,
    rawDistance,
    effectiveDistance,
    isWithinRadius,
    isLinkCopied,
    isLocationModalOpen,
    hasLowAccuracyOnIOS,
    environment,
    allowedRadiusMeters: event?.radius_meters && event.radius_meters > 0 ? event.radius_meters : 100,
    handleRequestLocation,
    handleOpenInAndroidChrome,
    handleDismissLocationModal,
    handleCopyCheckInLink,
  };
}
