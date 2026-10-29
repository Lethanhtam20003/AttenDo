'use client';

import { useState, useCallback } from 'react';

interface Coordinates {
  lat: number;
  lng: number;
}

interface GeolocationState {
  coordinates: Coordinates | null;
  error: string | null;
  isLoading: boolean;
}

export const useGeolocation = () => {
  const [state, setState] = useState<GeolocationState>({
    coordinates: null,
    error: null,
    isLoading: false,
  });

  const getLocation = useCallback((): Promise<Coordinates | null> => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setState({
        coordinates: null,
        error: 'Trình duyệt của bạn không hỗ trợ định vị GPS.',
        isLoading: false,
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
          setState({ coordinates, error: null, isLoading: false });
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
          setState({ coordinates: null, error: errorMessage, isLoading: false });
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  }, []);

  return { ...state, getLocation };
};