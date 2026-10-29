'use client';

import { useCallback, useState } from 'react';
import { useGeolocation } from '@/hooks/useGeolocation';

const DEFAULT_COORDINATES = { lat: 10.7769, lng: 106.7009 };

export function useHostSetupLocation() {
  const [coordinates, setCoordinates] = useState(DEFAULT_COORDINATES);
  const [radius, setRadius] = useState(100);
  const geolocation = useGeolocation();
  const { getLocation } = geolocation;

  const handleGetCurrentLocation = useCallback(async () => {
    const currentCoordinates = await getLocation();
    if (currentCoordinates) setCoordinates(currentCoordinates);
  }, [getLocation]);

  const handleMapLocationChange = useCallback((lat: number, lng: number) => {
    setCoordinates({ lat, lng });
  }, []);

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
