'use client';

import { useCallback } from 'react';

import { useGeolocation } from '@/hooks/host-setup/useGeolocation';
import { useHostSetupStore } from '@/stores/host-setup-store';

export function useHostSetupLocation() {
  const coordinates = useHostSetupStore((state) => state.coordinates);
  const radius = useHostSetupStore((state) => state.radius);
  const setCoordinates = useHostSetupStore((state) => state.setCoordinates);
  const setRadius = useHostSetupStore((state) => state.setRadius);
  const geolocation = useGeolocation();
  const { getLocation } = geolocation;

  const handleGetCurrentLocation = useCallback(async () => {
    const currentCoordinates = await getLocation();
    if (currentCoordinates) setCoordinates(currentCoordinates);
  }, [getLocation, setCoordinates]);

  const handleMapLocationChange = useCallback((lat: number, lng: number) => {
    setCoordinates({ lat, lng });
  }, [setCoordinates]);

  return {
    coordinates,
    radius,
    setRadius,
    isLocating: geolocation.isLoading,
    locationError: geolocation.error,
    handleGetCurrentLocation,
    handleMapLocationChange,
  };
}
