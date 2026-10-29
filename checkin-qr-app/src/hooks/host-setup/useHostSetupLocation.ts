'use client';

import { useCallback, useState } from 'react';

import { useGeolocation } from '@/hooks/host-setup/useGeolocation';

const DEFAULT_COORDINATES = { lat: 10.64102, lng: 107.34564 };

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
