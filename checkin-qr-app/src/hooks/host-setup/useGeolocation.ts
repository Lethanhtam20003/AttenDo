'use client';

import { useCallback } from 'react';
import { useHostSetupStore } from '@/stores/host-setup-store';

interface Coordinates {
  lat: number;
  lng: number;
}

export const useGeolocation = () => {
  const coordinates = useHostSetupStore((state) => state.coordinates);
  const error = useHostSetupStore((state) => state.locationError);
  const isLoading = useHostSetupStore((state) => state.isLocating);
  const setCoordinates = useHostSetupStore((state) => state.setCoordinates);
  const setGeolocation = useHostSetupStore((state) => state.setGeolocation);

  const getLocation = useCallback((): Promise<Coordinates | null> => {
    setGeolocation({ isLocating: true, locationError: null });

    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setGeolocation({
        locationError: 'Trình duyệt của bạn không hỗ trợ định vị GPS.',
        isLocating: false,
      });
      return Promise.resolve(null);
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coordinates = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setCoordinates(coordinates);
          setGeolocation({ locationError: null, isLocating: false });
          resolve(coordinates);
        },
        (error) => {
          let errorMessage = 'Đã có lỗi xảy ra khi lấy vị trí.';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Vui lòng cấp quyền truy cập vị trí để điểm danh.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Không thể xác định được vị trí hiện tại (mất tín hiệu GPS).';
              break;
            case error.TIMEOUT:
              errorMessage = 'Quá thời gian yêu cầu lấy vị trí. Vui lòng thử lại.';
              break;
          }
          setGeolocation({ locationError: errorMessage, isLocating: false });
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  }, [setCoordinates, setGeolocation]);

  return { coordinates, error, isLoading, getLocation };
};