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
        async (error) => {
          let errorMessage = 'Vui lòng mở Vị trí (GPS) trên thiết bị của bạn rồi thử lại.';
          if (error.code === error.PERMISSION_DENIED) {
            let isGrantedOnWeb = false;
            if (navigator.permissions?.query) {
              try {
                const status = await navigator.permissions.query({ name: 'geolocation' });
                isGrantedOnWeb = status.state === 'granted';
              } catch {
                // Bỏ qua nếu trình duyệt không hỗ trợ Permissions API.
              }
            }
            errorMessage = isGrantedOnWeb
              ? 'Vui lòng mở Vị trí (GPS) trên thiết bị của bạn rồi thử lại.'
              : 'Vui lòng mở Vị trí (GPS) trên thiết bị và cho phép trình duyệt truy cập vị trí.';
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            errorMessage = 'Vui lòng mở Vị trí (GPS) trên thiết bị của bạn rồi thử lại.';
          } else if (error.code === error.TIMEOUT) {
            errorMessage = 'Quá thời gian chờ tín hiệu. Vui lòng mở Vị trí (GPS) trên thiết bị rồi thử lại.';
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